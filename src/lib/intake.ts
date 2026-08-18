import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AIDiagnosisService, AIIntakeService, type IntakeMessage } from "@/lib/ai";
import { trackEvent } from "@/lib/analytics";
import type { AIDiagnosis } from "@/lib/validations";

export async function startIntake(input: {
  problemText: string;
  platformSlug?: string;
  serviceSlug?: string;
  userId?: string;
}) {
  const platform = input.platformSlug
    ? await prisma.platform.findUnique({ where: { slug: input.platformSlug } })
    : null;
  const service = input.serviceSlug
    ? await prisma.service.findUnique({ where: { slug: input.serviceSlug }, include: { platform: true } })
    : null;

  const messages: IntakeMessage[] = [{ role: "user", content: input.problemText }];
  const diagnosis = await AIIntakeService.classify({
    problemText: input.problemText,
    history: messages,
    platformHint: platform?.slug ?? service?.platform.slug,
  });

  const recommended = diagnosis.recommendedService
    ? await prisma.service.findUnique({ where: { slug: diagnosis.recommendedService }, include: { platform: true } })
    : service;

  const answers: Record<string, string> = {};
  const pending = AIIntakeService.nextQuestions(recommended, answers);
  const assistant: IntakeMessage = {
    role: "assistant",
    content: diagnosis.summary,
    questions: pending.slice(0, 1),
    diagnosis: pending.length ? undefined : diagnosis,
  };
  messages.push(assistant);

  const session = await prisma.intakeSession.create({
    data: {
      guestToken: randomBytes(24).toString("hex"),
      userId: input.userId,
      platformId: recommended?.platformId ?? platform?.id ?? service?.platformId,
      recommendedServiceId: recommended?.id ?? service?.id,
      problemText: input.problemText,
      messages: messages as unknown as Prisma.InputJsonValue,
      diagnosis: pending.length ? Prisma.JsonNull : (diagnosis as unknown as Prisma.InputJsonValue),
      status: pending.length ? "GATHERING" : "DIAGNOSED",
    },
  });

  await AIDiagnosisService.persist({ intakeSessionId: session.id, diagnosis });
  await trackEvent("problem_submitted", { sessionId: session.id, platform: diagnosis.platform });
  return { session, diagnosis, recommended };
}

export async function replyToIntake(input: {
  sessionId: string;
  guestToken?: string | null;
  userId?: string | null;
  message?: string;
  answers?: Record<string, string>;
  skip?: boolean;
}) {
  const session = await prisma.intakeSession.findUnique({
    where: { id: input.sessionId },
    include: { recommendedService: { include: { platform: true } } },
  });
  if (!session) throw new Error("We couldn't find that problem session.");
  if (session.guestToken !== input.guestToken && session.userId !== input.userId) {
    throw new Error("You don't have access to this problem session.");
  }

  const messages = (session.messages as IntakeMessage[]) ?? [];
  const collected: Record<string, string> = {
    ...((session.diagnosis as { answers?: Record<string, string> } | null)?.answers ?? {}),
    ...(input.answers ?? {}),
  };
  if (input.message) {
    messages.push({ role: "user", content: input.message });
  }
  if (input.skip) {
    messages.push({ role: "user", content: "Skip remaining questions." });
  }

  const problemText = [session.problemText, ...messages.filter((m) => m.role === "user").map((m) => m.content)].join(
    "\n",
  );
  const diagnosis = await AIIntakeService.classify({
    problemText,
    history: messages,
    platformHint: session.recommendedService?.platform.slug,
  });
  const recommended = diagnosis.recommendedService
    ? await prisma.service.findUnique({
        where: { slug: diagnosis.recommendedService },
        include: { platform: true },
      })
    : session.recommendedService;

  const pending = input.skip ? [] : AIIntakeService.nextQuestions(recommended, collected);
  const ready = pending.length === 0;
  const assistant: IntakeMessage = {
    role: "assistant",
    content: ready
      ? `${diagnosis.summary}\n\nThis is a likely issue and recommended resolution, subject to platform systems and policies.`
      : diagnosis.summary,
    questions: pending.slice(0, 1),
    diagnosis: ready ? diagnosis : undefined,
  };
  messages.push(assistant);

  const updated = await prisma.intakeSession.update({
    where: { id: session.id },
    data: {
      messages: messages as unknown as Prisma.InputJsonValue,
      diagnosis: {
        ...diagnosis,
        answers: collected,
      } as unknown as Prisma.InputJsonValue,
      recommendedServiceId: recommended?.id ?? session.recommendedServiceId,
      platformId: recommended?.platformId ?? session.platformId,
      status: ready ? "DIAGNOSED" : "GATHERING",
    },
    include: { recommendedService: { include: { platform: true } } },
  });
  await AIDiagnosisService.persist({ intakeSessionId: session.id, diagnosis });
  if (ready) await trackEvent("diagnostic_completed", { sessionId: session.id });
  return { session: updated, diagnosis: diagnosis as AIDiagnosis, recommended };
}

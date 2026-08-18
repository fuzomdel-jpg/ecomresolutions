import { Complexity, Prisma, Service } from "@prisma/client";
import OpenAI from "openai";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { aiDiagnosisSchema, type AIDiagnosis } from "@/lib/validations";
import { fuzzyScore } from "@/lib/search";

export type IntakeMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  questions?: {
    id: string;
    prompt: string;
    required: boolean;
    type: "choice" | "text" | "upload";
    options?: { value: string; label: string }[];
  }[];
  diagnosis?: AIDiagnosis;
};

type CatalogService = Pick<
  Service,
  "slug" | "name" | "shortDescription" | "priceCents" | "complexity" | "slaLabel" | "intakeQuestions"
> & { platform: { slug: string; name: string } };

export async function loadCatalogServices() {
  return prisma.service.findMany({
    where: { isActive: true },
    include: { platform: true },
    orderBy: [{ platform: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });
}

function heuristicDiagnosis(problemText: string, services: CatalogService[], platformHint?: string): AIDiagnosis {
  const ranked = services
    .map((service) => {
      const haystack = `${service.platform.name} ${service.platform.slug} ${service.name} ${service.shortDescription} ${service.slug}`;
      let score = fuzzyScore(problemText, haystack);
      if (platformHint && service.platform.slug === platformHint) score += 0.25;
      return { service, score };
    })
    .sort((a, b) => b.score - a.score);

  const best = ranked[0]?.score && ranked[0].score > 0.3 ? ranked[0].service : null;
  const platform = best?.platform.slug ?? platformHint ?? null;
  return aiDiagnosisSchema.parse({
    platform,
    issueCategory: best?.slug.replace(`${platform ?? ""}-`, "") ?? "unknown",
    probableCause: best ? `Likely related to ${best.name}` : "Needs specialist review",
    confidence: best ? Math.min(0.92, Math.max(0.55, ranked[0]?.score ?? 0.55)) : 0.4,
    complexity: (best?.complexity ?? "DIAGNOSTIC") as Complexity,
    recommendedService: best?.slug ?? null,
    recommendedPrice: best ? Math.round(best.priceCents / 100) : 149,
    estimatedSla: best?.slaLabel ?? "24 hours",
    additionalInformationRequired: [],
    summary: best
      ? `Got it. It sounds like you're experiencing a ${best.platform.name} issue related to ${best.name.replace(best.platform.name, "").trim().toLowerCase() || "this listing problem"}.`
      : "Got it. We'll treat this as a diagnostic so a specialist can identify the likely issue.",
  });
}

async function openAIDiagnosis(
  problemText: string,
  history: IntakeMessage[],
  services: CatalogService[],
  platformHint?: string,
): Promise<AIDiagnosis> {
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const catalog = services.map((service) => ({
    slug: service.slug,
    name: service.name,
    platform: service.platform.slug,
    price: Math.round(service.priceCents / 100),
    complexity: service.complexity,
    sla: service.slaLabel,
  }));

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: `You are the intake engine for Ecom Resolutions, a productized e-commerce problem-resolution platform.
Return JSON matching:
{
  "platform": string|null,
  "issueCategory": string,
  "probableCause": string,
  "confidence": number,
  "complexity": "QUICK"|"STANDARD"|"COMPLEX"|"DIAGNOSTIC",
  "recommendedService": string|null,
  "recommendedPrice": number|null,
  "estimatedSla": string|null,
  "additionalInformationRequired": string[],
  "summary": string,
  "caution": string
}
Rules:
- Never promise marketplace approval or successful reinstatement.
- Use cautious language: likely issue, recommended resolution, subject to platform systems and policies.
- recommendedService must be one of the provided slugs or null.
- recommendedPrice is an integer in dollars matching the catalog when a service is chosen.
- If uncertain, recommend a diagnostic service.
- Do not mention tickets, agents, consultants, or helpdesks.`,
      },
      {
        role: "user",
        content: JSON.stringify({
          problemText,
          platformHint,
          catalog,
          conversation: history.map((message) => ({ role: message.role, content: message.content })),
        }),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = aiDiagnosisSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    return heuristicDiagnosis(problemText, services, platformHint);
  }
  if (parsed.data.recommendedService && !services.some((service) => service.slug === parsed.data.recommendedService)) {
    parsed.data.recommendedService = null;
  }
  return parsed.data;
}

export class AIIntakeService {
  static async classify(input: {
    problemText: string;
    history: IntakeMessage[];
    platformHint?: string;
  }) {
    const services = await loadCatalogServices();
    if (env.OPENAI_API_KEY) {
      try {
        return await openAIDiagnosis(input.problemText, input.history, services, input.platformHint);
      } catch (error) {
        console.error("openai_intake_failed", error);
      }
    }
    return heuristicDiagnosis(input.problemText, services, input.platformHint);
  }

  static nextQuestions(service: CatalogService | null, answers: Record<string, string>) {
    const questions = (service?.intakeQuestions as IntakeMessage["questions"]) ?? [];
    return questions.filter((question) => !answers[question.id]);
  }
}

export class AIDiagnosisService {
  static async persist(input: {
    intakeSessionId?: string;
    caseId?: string;
    diagnosis: AIDiagnosis;
  }) {
    return prisma.aIAnalysis.create({
      data: {
        intakeSessionId: input.intakeSessionId,
        caseId: input.caseId,
        platform: input.diagnosis.platform,
        issueCategory: input.diagnosis.issueCategory,
        probableCause: input.diagnosis.probableCause,
        confidence: input.diagnosis.confidence,
        complexity: input.diagnosis.complexity,
        recommendedServiceSlug: input.diagnosis.recommendedService,
        recommendedPriceCents: input.diagnosis.recommendedPrice ? input.diagnosis.recommendedPrice * 100 : null,
        estimatedSla: input.diagnosis.estimatedSla,
        additionalInformationRequired: input.diagnosis.additionalInformationRequired,
        rawOutput: input.diagnosis as unknown as Prisma.InputJsonValue,
        status: "PENDING",
      },
    });
  }
}

export class AIKnowledgeService {
  static async similarCases(platformId?: string, serviceId?: string) {
    return prisma.case.findMany({
      where: {
        status: { in: ["RESOLVED", "CLOSED"] },
        ...(platformId ? { platformId } : {}),
        ...(serviceId ? { serviceId } : {}),
      },
      orderBy: { resolvedAt: "desc" },
      take: 3,
      select: { caseNumber: true, title: true, id: true },
    });
  }
}

export class AIResolutionReportService {
  static async draft(input: {
    title: string;
    description: string;
    diagnosis?: AIDiagnosis | null;
  }) {
    return {
      problem: input.title,
      rootCause: input.diagnosis?.probableCause ?? "Documented during specialist investigation.",
      actionTaken: "In-scope corrections were implemented against the reported issue.",
      verification: "Changes were verified in the seller tools available to the specialist.",
      result: "Resolved, subject to platform systems and policies.",
      recommendedPrevention: "Keep identifiers, attributes, and feed mappings consistent before the next submission.",
    };
  }
}

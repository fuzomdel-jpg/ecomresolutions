import { CaseStatus, PaymentStatus, Prisma, Priority } from "@prisma/client";
import { prisma } from "@/lib/db";
import { notifyCaseStakeholders, notifyUser } from "@/lib/notifications";
import { writeAudit } from "@/lib/audit";
import { emitAutomationEvent } from "@/lib/webhooks";
import { trackEvent } from "@/lib/analytics";
import { AIResolutionReportService } from "@/lib/ai";

export async function nextCaseNumber() {
  const sequence = await prisma.$transaction(async (tx) => {
    const current = await tx.caseSequence.upsert({
      where: { id: 1 },
      update: { lastNumber: { increment: 1 } },
      create: { id: 1, lastNumber: 10001 },
    });
    return current.lastNumber;
  });
  return `ER-${sequence}`;
}

export async function createCaseFromPayment(input: {
  organizationId: string;
  customerId: string;
  serviceId: string;
  intakeSessionId?: string | null;
  paymentId: string;
  title?: string;
  description?: string;
  actorId?: string;
}) {
  const existing = await prisma.case.findFirst({
    where: {
      OR: [
        ...(input.intakeSessionId ? [{ intakeSessionId: input.intakeSessionId }] : []),
        { payments: { some: { id: input.paymentId } } },
      ],
    },
  });
  if (existing) {
    await prisma.payment.update({
      where: { id: input.paymentId },
      data: { caseId: existing.id, status: PaymentStatus.SUCCEEDED },
    });
    return existing;
  }

  const service = await prisma.service.findUniqueOrThrow({
    where: { id: input.serviceId },
    include: { platform: true },
  });
  const intake = input.intakeSessionId
    ? await prisma.intakeSession.findUnique({ where: { id: input.intakeSessionId } })
    : null;
  const caseNumber = await nextCaseNumber();
  const slaDueAt = new Date(Date.now() + service.slaHours * 60 * 60 * 1000);
  const title =
    input.title ||
    intake?.problemText.slice(0, 80) ||
    `${service.platform.name} ${service.name}`;
  const description = input.description || intake?.problemText || service.shortDescription;

  const created = await prisma.case.create({
    data: {
      caseNumber,
      organizationId: input.organizationId,
      customerId: input.customerId,
      platformId: service.platformId,
      serviceId: service.id,
      intakeSessionId: input.intakeSessionId ?? undefined,
      title,
      description,
      status: CaseStatus.NEW,
      priority: Priority.STANDARD,
      priceCents: service.priceCents,
      paymentStatus: PaymentStatus.SUCCEEDED,
      slaHours: service.slaHours,
      slaDueAt,
      statusHistory: {
        create: { toStatus: CaseStatus.NEW, changedById: input.actorId, note: "Case created after payment." },
      },
      messages: {
        create: {
          authorType: "SYSTEM",
          kind: "STATUS",
          body: `Case ${caseNumber} is open. A specialist will review the diagnosis and continue the conversation here.`,
        },
      },
    },
  });

  await prisma.payment.update({
    where: { id: input.paymentId },
    data: { caseId: created.id, organizationId: input.organizationId, status: PaymentStatus.SUCCEEDED },
  });

  if (intake) {
    await prisma.intakeSession.update({
      where: { id: intake.id },
      data: { status: "CONVERTED", userId: input.customerId, organizationId: input.organizationId },
    });
    await prisma.aIAnalysis.updateMany({
      where: { intakeSessionId: intake.id, caseId: null },
      data: { caseId: created.id },
    });
    await prisma.caseAttachment.updateMany({
      where: { intakeSessionId: intake.id, caseId: null },
      data: { caseId: created.id, uploadedById: input.customerId },
    });
  }

  await writeAudit({
    actorId: input.actorId ?? input.customerId,
    action: "case.created",
    entityType: "Case",
    entityId: created.id,
    metadata: { caseNumber } as Prisma.InputJsonValue,
  });
  await notifyUser({
    userId: input.customerId,
    type: "case_created",
    title: `Case ${caseNumber} created`,
    body: "Your resolution case is open. You can communicate with the specialist here.",
    link: `/app/cases/${created.id}`,
    caseId: created.id,
  });
  await notifyCaseStakeholders({
    caseId: created.id,
    type: "case_created",
    title: `New case ${caseNumber}`,
    body: title,
    excludeUserId: input.customerId,
  });
  await trackEvent("case_created", { caseNumber, serviceId: service.id });
  await emitAutomationEvent("case.created", { caseId: created.id, caseNumber });
  return created;
}

export async function changeCaseStatus(input: {
  caseId: string;
  toStatus: CaseStatus;
  actorId: string;
  note?: string;
}) {
  const current = await prisma.case.findUniqueOrThrow({ where: { id: input.caseId } });
  const data: Prisma.CaseUpdateInput = {
    status: input.toStatus,
    resolvedAt: input.toStatus === "RESOLVED" ? new Date() : current.resolvedAt,
  };
  const updated = await prisma.case.update({
    where: { id: input.caseId },
    data: {
      ...data,
      statusHistory: {
        create: {
          fromStatus: current.status,
          toStatus: input.toStatus,
          changedById: input.actorId,
          note: input.note,
        },
      },
      messages: {
        create: {
          authorType: "SYSTEM",
          kind: "STATUS",
          body: statusCopy(input.toStatus),
        },
      },
    },
  });
  await writeAudit({
    actorId: input.actorId,
    action: "case.status_changed",
    entityType: "Case",
    entityId: current.id,
    metadata: { from: current.status, to: input.toStatus },
  });
  if (input.toStatus === "WAITING_FOR_CUSTOMER") {
    await notifyUser({
      userId: current.customerId,
      type: "customer_action_required",
      title: `${current.caseNumber}: action needed`,
      body: "Your specialist needs a bit more information to continue.",
      link: `/app/cases/${current.id}`,
      caseId: current.id,
    });
  }
  if (input.toStatus === "RESOLVED") {
    await notifyUser({
      userId: current.customerId,
      type: "case_resolved",
      title: `${current.caseNumber} is resolved`,
      body: "View the resolution report for what we found and changed.",
      link: `/app/cases/${current.id}?report=1`,
      caseId: current.id,
    });
    await trackEvent("case_resolved", { caseId: current.id });
  }
  return updated;
}

export function statusCopy(status: CaseStatus) {
  switch (status) {
    case "NEW":
      return "Case opened.";
    case "DIAGNOSING":
      return "Diagnosing the issue.";
    case "WAITING_FOR_CUSTOMER":
      return "Waiting for you. Please reply with the requested information.";
    case "IN_PROGRESS":
      return "Fix in progress.";
    case "QA":
      return "Verification is in progress.";
    case "RESOLVED":
      return "Resolved. You can view the resolution report.";
    case "CLOSED":
      return "Case closed.";
    case "CANCELLED":
      return "Case cancelled.";
    default:
      return "Status updated.";
  }
}

export const customerStatusLabel: Record<CaseStatus, string> = {
  NEW: "New",
  DIAGNOSING: "Diagnosing",
  WAITING_FOR_CUSTOMER: "Waiting for you",
  IN_PROGRESS: "Fix in progress",
  QA: "Verification",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

export async function ensureResolution(caseId: string) {
  const existing = await prisma.resolution.findUnique({ where: { caseId } });
  if (existing) return existing;
  const record = await prisma.case.findUniqueOrThrow({
    where: { id: caseId },
    include: { aiAnalyses: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  const latest = record.aiAnalyses[0];
  const draft = await AIResolutionReportService.draft({
    title: record.title,
    description: record.description,
    diagnosis: latest
      ? {
          platform: latest.platform,
          issueCategory: latest.issueCategory ?? "unknown",
          probableCause: latest.probableCause ?? "Under review",
          confidence: latest.confidence ?? 0.5,
          complexity: latest.complexity ?? "STANDARD",
          recommendedService: latest.recommendedServiceSlug,
          recommendedPrice: latest.recommendedPriceCents ? latest.recommendedPriceCents / 100 : null,
          estimatedSla: latest.estimatedSla,
          additionalInformationRequired: [],
          summary: record.title,
          caution: "Subject to platform systems and policies.",
        }
      : null,
  });
  return prisma.resolution.create({ data: { caseId, ...draft } });
}

export function slaRemaining(due: Date) {
  const ms = due.getTime() - Date.now();
  const hours = Math.round(ms / (1000 * 60 * 60));
  if (hours < 0) return `${Math.abs(hours)}h overdue`;
  if (hours < 24) return `${hours}h remaining`;
  return `${Math.round(hours / 24)}d remaining`;
}

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AdminCaseConsole } from "@/components/admin/case-console";
import { AIKnowledgeService } from "@/lib/ai";

export const dynamic = "force-dynamic";

export default async function AdminCasePage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const record = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      customer: true,
      platform: true,
      service: true,
      assignedAgent: true,
      messages: { include: { attachments: true, author: true }, orderBy: { createdAt: "asc" } },
      internalNotes: { include: { author: true }, orderBy: { createdAt: "desc" } },
      aiAnalyses: { orderBy: { createdAt: "desc" }, take: 1 },
      resolution: true,
      attachments: true,
    },
  });
  if (!record) notFound();
  const similar = await AIKnowledgeService.similarCases(record.platformId, record.serviceId);
  const team = await prisma.user.findMany({
    where: { role: { in: ["EXPERT", "ADMIN", "SUPER_ADMIN"] } },
    select: { id: true, name: true, email: true },
  });
  return (
    <AdminCaseConsole
      team={team}
      similar={similar}
      record={{
        id: record.id,
        caseNumber: record.caseNumber,
        title: record.title,
        description: record.description,
        status: record.status,
        priority: record.priority,
        priceCents: record.priceCents,
        slaDueAt: record.slaDueAt.toISOString(),
        customer: { email: record.customer.email, name: record.customer.name },
        platform: { name: record.platform.name },
        service: { name: record.service.name },
        assignedAgentId: record.assignedAgentId,
        messages: record.messages.map((message) => ({
          id: message.id,
          body: message.body,
          authorType: message.authorType,
          createdAt: message.createdAt.toISOString(),
        })),
        internalNotes: record.internalNotes.map((note) => ({
          id: note.id,
          body: note.body,
          createdAt: note.createdAt.toISOString(),
          author: note.author.name || note.author.email,
        })),
        ai: record.aiAnalyses[0]
          ? {
              id: record.aiAnalyses[0].id,
              probableCause: record.aiAnalyses[0].probableCause,
              confidence: record.aiAnalyses[0].confidence,
              recommendedServiceSlug: record.aiAnalyses[0].recommendedServiceSlug,
              status: record.aiAnalyses[0].status,
            }
          : null,
        resolution: record.resolution,
      }}
    />
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StatusBadge } from "@/components/cases/status-badge";
import { getSessionUser, userCanAccessCase } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { CaseThread } from "@/components/cases/case-thread";
import { ResolutionReport } from "@/components/cases/resolution-report";

export const dynamic = "force-dynamic";

export default async function CasePage({
  params,
  searchParams,
}: {
  params: Promise<{ caseId: string }>;
  searchParams: Promise<{ report?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { caseId } = await params;
  const query = await searchParams;
  const allowed = await userCanAccessCase(user.id, user.role, caseId);
  if (!allowed) notFound();
  const record = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      platform: true,
      service: true,
      assignedAgent: true,
      messages: { include: { attachments: true, author: true }, orderBy: { createdAt: "asc" } },
      attachments: true,
      resolution: true,
    },
  });
  if (!record) notFound();

  return (
    <div className="flex min-h-[70vh] flex-col">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <Link href="/app/cases" className="text-sm text-accent">
            ← My Cases
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-navy">{record.title}</h1>
          <p className="text-sm text-muted">Case #{record.caseNumber}</p>
        </div>
        <StatusBadge status={record.status} />
      </div>
      {record.resolution && query.report ? <ResolutionReport resolution={record.resolution} caseNumber={record.caseNumber} /> : null}
      <CaseThread
        caseId={record.id}
        messages={record.messages.map((message) => ({
          id: message.id,
          body: message.body,
          kind: message.kind,
          authorType: message.authorType,
          createdAt: message.createdAt.toISOString(),
          attachments: message.attachments.map((file) => ({ id: file.id, filename: file.filename })),
        }))}
        resolved={Boolean(record.resolution)}
      />
    </div>
  );
}

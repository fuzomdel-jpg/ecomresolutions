import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { notifyUser } from "@/lib/notifications";

export async function POST(request: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const user = await requireStaff();
  const { caseId } = await params;
  const { assignedAgentId } = await request.json();
  const record = await prisma.case.update({
    where: { id: caseId },
    data: { assignedAgentId: assignedAgentId || null },
  });
  if (assignedAgentId) {
    await notifyUser({
      userId: assignedAgentId,
      type: "specialist_assigned",
      title: `${record.caseNumber} assigned to you`,
      body: record.title,
      link: `/admin/cases/${caseId}`,
      caseId,
    });
    await notifyUser({
      userId: record.customerId,
      type: "specialist_assigned",
      title: `${record.caseNumber}: specialist assigned`,
      body: "A specialist is now working your case.",
      link: `/app/cases/${caseId}`,
      caseId,
    });
  }
  await writeAudit({ actorId: user.id, action: "case.assigned", entityType: "Case", entityId: caseId, metadata: { assignedAgentId } });
  return NextResponse.json({ ok: true });
}

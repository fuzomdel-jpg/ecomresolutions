import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { notifyUser } from "@/lib/notifications";
import { caseMessageSchema } from "@/lib/validations";

export async function POST(request: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const user = await requireStaff();
  const { caseId } = await params;
  const { body } = caseMessageSchema.parse(await request.json());
  await prisma.caseMessage.create({
    data: { caseId, authorId: user.id, authorType: "SPECIALIST", body, kind: "TEXT" },
  });
  const record = await prisma.case.findUniqueOrThrow({ where: { id: caseId } });
  await notifyUser({
    userId: record.customerId,
    type: "specialist_replied",
    title: `${record.caseNumber}: specialist replied`,
    body,
    link: `/app/cases/${caseId}`,
    caseId,
  });
  await writeAudit({ actorId: user.id, action: "case.customer_message", entityType: "Case", entityId: caseId });
  return NextResponse.json({ ok: true });
}

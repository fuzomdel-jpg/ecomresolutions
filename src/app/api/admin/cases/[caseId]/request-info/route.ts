import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth-helpers";
import { changeCaseStatus } from "@/lib/cases";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";

export async function POST(request: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const user = await requireStaff();
  const { caseId } = await params;
  const { body } = await request.json();
  await prisma.caseMessage.create({
    data: {
      caseId,
      authorId: user.id,
      authorType: "SPECIALIST",
      kind: "REQUEST_INFO",
      body: body || "Please share the requested information so we can continue.",
    },
  });
  await changeCaseStatus({ caseId, toStatus: "WAITING_FOR_CUSTOMER", actorId: user.id, note: "Information requested" });
  await writeAudit({ actorId: user.id, action: "case.request_info", entityType: "Case", entityId: caseId });
  return NextResponse.json({ ok: true });
}

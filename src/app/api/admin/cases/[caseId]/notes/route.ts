import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { internalNoteSchema } from "@/lib/validations";

export async function POST(request: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const user = await requireStaff();
  const { caseId } = await params;
  const { body } = internalNoteSchema.parse(await request.json());
  await prisma.internalNote.create({ data: { caseId, authorId: user.id, body } });
  await writeAudit({ actorId: user.id, action: "case.internal_note", entityType: "Case", entityId: caseId });
  return NextResponse.json({ ok: true });
}

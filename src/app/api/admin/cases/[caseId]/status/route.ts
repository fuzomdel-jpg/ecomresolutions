import { NextResponse } from "next/server";
import { CaseStatus } from "@prisma/client";
import { requireStaff } from "@/lib/auth-helpers";
import { changeCaseStatus } from "@/lib/cases";

export async function POST(request: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const user = await requireStaff();
  const { caseId } = await params;
  const { status } = await request.json();
  await changeCaseStatus({ caseId, toStatus: status as CaseStatus, actorId: user.id });
  return NextResponse.json({ ok: true });
}

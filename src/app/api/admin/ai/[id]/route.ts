import { NextResponse } from "next/server";
import { AIAnalysisStatus } from "@prisma/client";
import { requireStaff } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireStaff();
  const { id } = await params;
  const { status } = (await request.json()) as { status: AIAnalysisStatus };
  await prisma.aIAnalysis.update({ where: { id }, data: { status, reviewedById: user.id } });
  await writeAudit({ actorId: user.id, action: "ai.reviewed", entityType: "AIAnalysis", entityId: id, metadata: { status } });
  return NextResponse.json({ ok: true });
}

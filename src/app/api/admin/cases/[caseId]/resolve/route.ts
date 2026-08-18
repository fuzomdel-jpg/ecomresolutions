import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth-helpers";
import { changeCaseStatus, ensureResolution } from "@/lib/cases";
import { prisma } from "@/lib/db";
import { resolutionSchema } from "@/lib/validations";
import { writeAudit } from "@/lib/audit";
import { trackEvent } from "@/lib/analytics";

export async function POST(request: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const user = await requireStaff();
  const { caseId } = await params;
  const parsed = resolutionSchema.parse(await request.json());
  await prisma.resolution.upsert({
    where: { caseId },
    update: parsed,
    create: { caseId, ...parsed },
  });
  await changeCaseStatus({ caseId, toStatus: "RESOLVED", actorId: user.id });
  await ensureResolution(caseId);
  await writeAudit({ actorId: user.id, action: "case.resolved", entityType: "Case", entityId: caseId });
  await trackEvent("resolution_report_viewed", { caseId });
  return NextResponse.json({ ok: true });
}

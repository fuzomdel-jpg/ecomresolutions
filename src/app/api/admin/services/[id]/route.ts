import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { serviceUpdateSchema } from "@/lib/validations";
import { writeAudit } from "@/lib/audit";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  const { id } = await params;
  const parsed = serviceUpdateSchema.parse(await request.json());
  const updated = await prisma.service.update({ where: { id }, data: parsed });
  await writeAudit({ actorId: user.id, action: "service.updated", entityType: "Service", entityId: id, metadata: { priceCents: parsed.priceCents } });
  return NextResponse.json(updated);
}

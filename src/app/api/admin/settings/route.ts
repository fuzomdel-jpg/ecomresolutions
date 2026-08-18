import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const user = await requireAdmin();
  const { key, value } = await request.json();
  await prisma.appSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  await writeAudit({ actorId: user.id, action: "settings.updated", entityType: "AppSetting", entityId: key });
  return NextResponse.json({ ok: true });
}

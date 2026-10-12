import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { writeAudit } from "@/lib/audit";
import { parseResearchSettings } from "@/lib/leads/parse";
import { saveResearchConfig } from "@/lib/leads/persist";

export async function POST(request: Request) {
  const user = await requireAdmin();
  const config = await saveResearchConfig(parseResearchSettings(await request.json()));
  await writeAudit({
    actorId: user.id,
    action: "lead.settings.updated",
    entityType: "AppSetting",
    entityId: "leadResearchConfig",
    metadata: config,
  });
  return NextResponse.json({ ok: true, config });
}

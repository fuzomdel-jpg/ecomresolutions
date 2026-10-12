import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth-helpers";
import { writeAudit } from "@/lib/audit";
import { parseCompanyInput } from "@/lib/leads/parse";
import { ingestCompany } from "@/lib/leads/persist";

export async function POST(request: Request) {
  const user = await requireStaff();
  const parsed = parseCompanyInput(await request.json());
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const result = await ingestCompany(parsed.value);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 });
  await writeAudit({
    actorId: user.id,
    action: "lead.ingested",
    entityType: "LeadCompany",
    entityId: result.company?.id,
    metadata: { markets: result.evaluation.markets.map((market) => market.market), dedupeKey: result.evaluation.dedupeKey },
  });
  return NextResponse.json({ id: result.company?.id });
}

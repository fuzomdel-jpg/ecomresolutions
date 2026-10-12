import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth-helpers";
import { writeAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { buildOutreachDraft, canSendOutreach } from "@/lib/leads/qualify";
import { getLeadCompany, optOutContact, suppressCompany } from "@/lib/leads/persist";
import { prisma } from "@/lib/db";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const user = await requireStaff();
  const { id } = await context.params;
  const body = (await request.json()) as Record<string, unknown>;
  const action = String(body.action ?? "");
  const company = await getLeadCompany(id);
  if (!company) return NextResponse.json({ error: "Lead not found." }, { status: 404 });

  if (action === "suppress") {
    const reason = String(body.reason ?? "Suppressed by staff");
    await suppressCompany(id, reason);
    await writeAudit({ actorId: user.id, action: "lead.suppressed", entityType: "LeadCompany", entityId: id });
    return NextResponse.json({ ok: true });
  }

  if (action === "opt-out") {
    const contactId = String(body.contactId ?? "");
    await optOutContact(contactId, String(body.reason ?? "Opted out"));
    await writeAudit({ actorId: user.id, action: "lead.opt_out", entityType: "LeadContact", entityId: contactId });
    return NextResponse.json({ ok: true });
  }

  if (action === "draft") {
    const contact = company.contacts.find((item) => item.relevant && !item.optedOut) ?? company.contacts[0];
    const market = company.markets[0];
    const draft = buildOutreachDraft({
      companyName: company.name,
      contactName: contact?.name ?? "there",
      marketplace: market?.targetMarketplace ?? "marketplace",
      opportunity: market?.opportunity ?? "",
      sellingMarketLocation: market?.sellingMarketLocation ?? company.headquartersLocation,
    });
    const created = await prisma.outreachDraft.create({
      data: {
        companyId: company.id,
        contactId: contact?.id,
        subject: String(body.subject ?? draft.subject),
        body: String(body.body ?? draft.body),
        status: "DRAFT",
      },
    });
    await writeAudit({ actorId: user.id, action: "lead.draft_created", entityType: "OutreachDraft", entityId: created.id });
    return NextResponse.json({ ok: true, id: created.id });
  }

  const draftId = String(body.draftId ?? "");
  const draft = company.drafts.find((item) => item.id === draftId);
  if (!draft) return NextResponse.json({ error: "Draft not found." }, { status: 404 });

  if (action === "approve") {
    await prisma.outreachDraft.update({
      where: { id: draft.id },
      data: { status: "APPROVED", approvedById: user.id, approvedAt: new Date(), rejectionReason: null },
    });
    await writeAudit({ actorId: user.id, action: "lead.draft_approved", entityType: "OutreachDraft", entityId: draft.id });
    return NextResponse.json({ ok: true });
  }

  if (action === "reject") {
    await prisma.outreachDraft.update({
      where: { id: draft.id },
      data: { status: "REJECTED", rejectionReason: String(body.reason ?? "Rejected by reviewer") },
    });
    await writeAudit({ actorId: user.id, action: "lead.draft_rejected", entityType: "OutreachDraft", entityId: draft.id });
    return NextResponse.json({ ok: true });
  }

  if (action === "send") {
    const contact = draft.contact;
    const gate = canSendOutreach({
      status: draft.status,
      email: contact?.email ?? "",
      verificationStatus: contact?.verificationStatus ?? "UNVERIFIED",
      optedOut: contact?.optedOut ?? false,
      suppressed: company.suppressed,
    });
    if (!gate.ok) return NextResponse.json({ error: gate.reason }, { status: 409 });
    await sendEmail({ to: contact?.email ?? "", subject: draft.subject, text: draft.body });
    await prisma.outreachDraft.update({ where: { id: draft.id }, data: { status: "SENT", sentAt: new Date() } });
    await writeAudit({ actorId: user.id, action: "lead.draft_sent", entityType: "OutreachDraft", entityId: draft.id });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}

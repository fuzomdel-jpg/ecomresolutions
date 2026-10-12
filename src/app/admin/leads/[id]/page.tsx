import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card } from "@/components/ui/card";
import { LeadRecordActions } from "@/components/admin/lead-record-actions";
import { formatOperatingLocations, getLeadCompany } from "@/lib/leads/persist";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = await getLeadCompany(id);
  if (!company) notFound();

  const fields = [
    ["Country", company.country],
    ["Emirate or US state", company.region],
    ["City", company.city],
    ["Headquarters", company.headquartersLocation],
    ["Operating locations", formatOperatingLocations(company.operatingLocations) || "None recorded"],
    ["Website", company.website],
    ["Location status", company.locationStatus === "VERIFIED" ? "Verified" : "Unverified"],
    ["Date last verified", company.lastVerifiedAt ? company.lastVerifiedAt.toISOString().slice(0, 10) : "Not verified"],
    ["Ships to", company.shipsTo.join(", ") || "Not recorded"],
  ];

  return (
    <div>
      <Link href="/admin/leads" className="text-sm text-muted">
        Back to leads
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold text-navy">{company.name}</h1>
        {company.isSample ? <Badge tone="slate">Sample</Badge> : null}
        {company.suppressed ? <Badge tone="red">Suppressed</Badge> : null}
      </div>
      <p className="mt-2 max-w-3xl text-sm text-muted">{company.locationEvidence || "No location evidence recorded."}</p>
      {company.locationSourceUrl ? (
        <a className="mt-1 inline-block text-sm text-accent" href={company.locationSourceUrl}>
          Location source
        </a>
      ) : null}

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-medium">Geographic record</h2>
          <dl className="mt-3 space-y-2 text-sm">
            {fields.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[160px_1fr] gap-2">
                <dt className="text-muted">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <Card className="p-5">
          <h2 className="font-medium">Pipelines</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {company.markets.map((market) => (
              <li key={market.id}>
                <p className="font-medium">
                  {market.market === "US" ? "United States" : "Dubai"} · {market.sellingMarketLocation}
                </p>
                <p>Target marketplace: {market.targetMarketplace}</p>
                <p>Evidence: {market.marketplaceEvidence || "None recorded"}</p>
                <p>Opportunity: {market.opportunity || "None recorded"}</p>
                <p>
                  Score {market.leadScore} · {market.priority} · {market.recommendedServiceName}
                </p>
                <p className="text-muted">{market.reason}</p>
              </li>
            ))}
            {company.markets.length === 0 ? <li>This company is outside both pipelines.</li> : null}
          </ul>
        </Card>
      </div>

      <Card className="mt-4 p-5">
        <h2 className="font-medium">Decision-makers</h2>
        <ul className="mt-3 space-y-3 text-sm">
          {company.contacts.map((contact) => (
            <li key={contact.id}>
              <p className="font-medium">
                {contact.name} · {contact.title}
              </p>
              <p>Email: {contact.email || "Not listed"} · {contact.verificationStatus}{contact.optedOut ? " · Opted out" : ""}</p>
              {contact.profileUrl ? (
                <a className="text-accent" href={contact.profileUrl}>
                  Public profile
                </a>
              ) : null}
            </li>
          ))}
          {company.contacts.length === 0 ? <li>No relevant decision-maker is recorded yet.</li> : null}
        </ul>
      </Card>

      <Card className="mt-4 p-5">
        <h2 className="font-medium">Sources</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {company.sources.map((source) => (
            <li key={source.id}>
              <a className="text-accent" href={source.url}>
                {source.label}
              </a>
            </li>
          ))}
          {company.sources.length === 0 ? <li>No sources recorded.</li> : null}
        </ul>
      </Card>

      <Card className="mt-4 p-5">
        <h2 className="font-medium">Outreach</h2>
        <p className="mt-1 text-sm text-muted">Drafts stay here until a person approves them. Sending is blocked before approval, and suppressed or opted-out contacts cannot be emailed.</p>
        <div className="mt-4 space-y-4">
          {company.drafts.map((draft) => (
            <pre key={draft.id} className="whitespace-pre-wrap rounded-xl bg-accent-soft p-3 text-sm">
              {draft.body}
            </pre>
          ))}
          <LeadRecordActions
            companyId={company.id}
            drafts={company.drafts.map((draft) => ({ id: draft.id, status: draft.status, subject: draft.subject }))}
            contacts={company.contacts.map((contact) => ({ id: contact.id, name: contact.name, optedOut: contact.optedOut }))}
          />
        </div>
      </Card>
    </div>
  );
}

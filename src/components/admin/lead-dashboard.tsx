import Link from "next/link";
import { Badge, Card } from "@/components/ui/card";
import { LeadSettingsForm } from "@/components/admin/lead-settings-form";
import { pipelineLabels, pipelineStats, type PipelineRecord } from "@/lib/leads/pipeline";
import { formatOperatingLocations, type LeadCompanyRecord } from "@/lib/leads/persist";
import { DUBAI_DECISION_MAKER_TITLES, DUBAI_MARKETPLACES, US_DECISION_MAKER_TITLES, US_MARKETPLACES, type LeadMarketId, type ResearchConfig } from "@/lib/leads/types";

function recordsFor(companies: LeadCompanyRecord[], market: LeadMarketId): PipelineRecord[] {
  return companies.flatMap((company) =>
    company.markets
      .filter((row) => row.market === market)
      .map((row) => ({
        suppressed: company.suppressed,
        qualified: row.qualified,
        priority: row.priority,
        marketplaceEvidence: row.marketplaceEvidence,
        opportunity: row.opportunity,
        contacts: company.contacts.map((contact) => ({
          relevant: contact.relevant,
          verificationStatus: contact.verificationStatus,
          optedOut: contact.optedOut,
        })),
      })),
  );
}

function toneFor(priority: string) {
  if (priority === "A") return "green" as const;
  if (priority === "B") return "blue" as const;
  if (priority === "C") return "amber" as const;
  return "slate" as const;
}

export function LeadDashboard({
  companies,
  config,
  market,
}: {
  companies: LeadCompanyRecord[];
  config: ResearchConfig;
  market: LeadMarketId | "ALL";
}) {
  const labels = pipelineLabels(market);
  const us = pipelineStats(recordsFor(companies, "US"));
  const dubai = pipelineStats(recordsFor(companies, "DUBAI"));
  const stats = market === "US" ? us : market === "DUBAI" ? dubai : pipelineStats([...recordsFor(companies, "US"), ...recordsFor(companies, "DUBAI")]);
  const visible = companies.filter((company) => market === "ALL" || company.markets.some((row) => row.market === market));
  const sampleCount = visible.filter((company) => company.isSample).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-navy">{labels.title}</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted">{labels.description}</p>
        </div>
        <Link href="/admin/leads/new" className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white">
          Add company
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link href="/admin/leads" className={market === "ALL" ? "font-semibold text-navy" : "text-muted"}>
          Combined
        </Link>
        <Link href="/admin/leads/us" className={market === "US" ? "font-semibold text-navy" : "text-muted"}>
          US pipeline
        </Link>
        <Link href="/admin/leads/dubai" className={market === "DUBAI" ? "font-semibold text-navy" : "text-muted"}>
          Dubai pipeline
        </Link>
      </div>

      {market === "ALL" ? (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <MarketSummary title="United States" stats={us} limit={config.batchSizePerMarket} />
          <MarketSummary title="Dubai, UAE" stats={dubai} limit={config.batchSizePerMarket} />
        </div>
      ) : (
        <div className="mt-6 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Stat label={labels.discovered} value={`${stats.discovered} / ${config.batchSizePerMarket}`} />
          <Stat label={labels.qualified} value={stats.qualified} />
          <Stat label={labels.decisionMakers} value={stats.decisionMakers} />
          <Stat label={labels.verifiedContacts} value={stats.verifiedContacts} />
          <Stat label={labels.marketplaceOpportunities} value={stats.marketplaceOpportunities} />
          <Stat label={labels.priorityA} value={stats.priorityA} />
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <ExportLink market={market} format="csv" />
        <ExportLink market={market} format="xlsx" />
        {market === "ALL" ? (
          <>
            <ExportLink market="US" format="csv" label="US CSV" />
            <ExportLink market="US" format="xlsx" label="US XLSX" />
            <ExportLink market="DUBAI" format="csv" label="Dubai CSV" />
            <ExportLink market="DUBAI" format="xlsx" label="Dubai XLSX" />
          </>
        ) : null}
      </div>

      {sampleCount > 0 ? (
        <p className="mt-4 text-sm text-muted">
          {sampleCount} sample {sampleCount === 1 ? "company is" : "companies are"} shown so the pipelines can be reviewed. They are labeled Sample and are not researched prospects.
        </p>
      ) : null}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="text-xs text-muted">
            <tr>
              <th className="py-2 pr-3 font-medium">Company</th>
              <th className="py-2 pr-3 font-medium">Headquarters</th>
              <th className="py-2 pr-3 font-medium">Selling market</th>
              <th className="py-2 pr-3 font-medium">Marketplace</th>
              <th className="py-2 pr-3 font-medium">Score</th>
              <th className="py-2 pr-3 font-medium">Location</th>
              <th className="py-2 font-medium">Service</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((company) => {
              const rows = company.markets.filter((row) => market === "ALL" || row.market === market);
              return rows.map((row) => (
                <tr key={`${company.id}-${row.market}`} className="border-t border-border">
                  <td className="py-3 pr-3">
                    <Link href={`/admin/leads/${company.id}`} className="font-medium text-navy">
                      {company.name}
                    </Link>
                    <p className="text-xs text-muted">{company.website.replace(/^https?:\/\//, "")}</p>
                    {company.isSample ? <Badge tone="slate">Sample</Badge> : null}
                    {company.suppressed ? <Badge tone="red">Suppressed</Badge> : null}
                  </td>
                  <td className="py-3 pr-3">
                    {company.headquartersLocation || "Unverified"}
                    <p className="text-xs text-muted">{formatOperatingLocations(company.operatingLocations) || "No separate operating location"}</p>
                  </td>
                  <td className="py-3 pr-3">{row.sellingMarketLocation}</td>
                  <td className="py-3 pr-3">
                    {row.targetMarketplace}
                    <p className="text-xs text-muted">{row.qualified ? "Qualified" : row.reason}</p>
                  </td>
                  <td className="py-3 pr-3">
                    <Badge tone={toneFor(row.priority)}>{row.priority === "DISQUALIFIED" ? "Disqualified" : `Priority ${row.priority}`}</Badge>
                    <p className="mt-1 text-xs text-muted">{row.leadScore}</p>
                  </td>
                  <td className="py-3 pr-3">{company.locationStatus === "VERIFIED" ? "Verified" : "Unverified"}</td>
                  <td className="py-3">{row.recommendedServiceName}</td>
                </tr>
              ));
            })}
          </tbody>
        </table>
        {visible.length === 0 ? <p className="mt-4 text-sm text-muted">No companies are in this pipeline yet.</p> : null}
      </div>

      {market === "ALL" ? (
        <Card className="mt-8 p-5">
          <h2 className="font-medium">Research configuration</h2>
          <p className="mt-1 text-sm text-muted">
            Default research is the United States and Dubai only, with {config.batchSizePerMarket} companies per market and {config.maxCompaniesPerRun} companies in a run. Up to {config.maxContactsPerCompany} decision-makers are kept per company. India and every other country stay out until named here.
          </p>
          <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
            <div>
              <p className="font-medium">United States channels</p>
              <p className="text-muted">{US_MARKETPLACES.join(", ")}</p>
              <p className="mt-2 font-medium">US decision-makers</p>
              <p className="text-muted">{US_DECISION_MAKER_TITLES.join(", ")}</p>
            </div>
            <div>
              <p className="font-medium">Dubai channels</p>
              <p className="text-muted">{DUBAI_MARKETPLACES.join(", ")}</p>
              <p className="mt-2 font-medium">Dubai decision-makers</p>
              <p className="text-muted">{DUBAI_DECISION_MAKER_TITLES.join(", ")}</p>
            </div>
          </div>
          <div className="mt-4">
            <LeadSettingsForm
              batchSizePerMarket={config.batchSizePerMarket}
              maxCompaniesPerRun={config.maxCompaniesPerRun}
              maxContactsPerCompany={config.maxContactsPerCompany}
              additionalCountries={config.additionalCountries}
              usEnabled={config.enabledMarkets.includes("US")}
              dubaiEnabled={config.enabledMarkets.includes("DUBAI")}
            />
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </Card>
  );
}

function MarketSummary({
  title,
  stats,
  limit,
}: {
  title: string;
  stats: ReturnType<typeof pipelineStats>;
  limit: number;
}) {
  return (
    <Card className="p-4">
      <p className="font-medium">{title}</p>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>Discovered</div>
        <div>
          {stats.discovered} / {limit}
        </div>
        <div>Qualified</div>
        <div>{stats.qualified}</div>
        <div>Decision-makers</div>
        <div>{stats.decisionMakers}</div>
        <div>Verified contacts</div>
        <div>{stats.verifiedContacts}</div>
        <div>Marketplace opportunities</div>
        <div>{stats.marketplaceOpportunities}</div>
        <div>Priority A</div>
        <div>{stats.priorityA}</div>
      </dl>
    </Card>
  );
}

function ExportLink({ market, format, label }: { market: LeadMarketId | "ALL"; format: "csv" | "xlsx"; label?: string }) {
  const text = label ?? `${market === "ALL" ? "Combined" : market === "US" ? "US" : "Dubai"} ${format.toUpperCase()}`;
  return (
    <a className="rounded-full border border-border bg-white px-3 py-1.5" href={`/api/admin/leads/export?market=${market}&format=${format}`}>
      {text}
    </a>
  );
}

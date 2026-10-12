import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { acceptanceDecision, clampResearchConfig, evaluateCompany, websiteHostname } from "./qualify";
import type { CompanyInput, LeadMarketId, ResearchConfig } from "./types";
import { DEFAULT_RESEARCH_CONFIG } from "./types";

const SETTINGS_KEY = "leadResearchConfig";

export async function getResearchConfig(): Promise<ResearchConfig> {
  const setting = await prisma.appSetting.findUnique({ where: { key: SETTINGS_KEY } });
  if (!setting) return DEFAULT_RESEARCH_CONFIG;
  return clampResearchConfig(setting.value as Partial<ResearchConfig>);
}

export async function saveResearchConfig(value: Partial<ResearchConfig>) {
  const config = clampResearchConfig(value);
  await prisma.appSetting.upsert({
    where: { key: SETTINGS_KEY },
    update: { value: config },
    create: { key: SETTINGS_KEY, value: config },
  });
  return config;
}

const companyInclude = {
  markets: true,
  contacts: true,
  sources: true,
  drafts: { include: { contact: true }, orderBy: { createdAt: "desc" as const } },
} satisfies Prisma.LeadCompanyInclude;

export type LeadCompanyRecord = Prisma.LeadCompanyGetPayload<{ include: typeof companyInclude }>;

export async function listLeadCompanies() {
  return prisma.leadCompany.findMany({
    include: companyInclude,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getLeadCompany(id: string) {
  return prisma.leadCompany.findUnique({ where: { id }, include: companyInclude });
}

function operatingLocationsJson(input: CompanyInput): Prisma.InputJsonValue {
  return input.operatingLocations.map((location) => ({
    country: location.country.trim(),
    region: location.region.trim(),
    city: location.city.trim(),
    substantialEcommerce: location.substantialEcommerce,
  }));
}

async function suppressionMatches(input: CompanyInput) {
  const domain = websiteHostname(input.website);
  const emails = input.decisionMakers.map((contact) => contact.email?.trim().toLowerCase()).filter((email): email is string => !!email);
  const values = [domain, ...emails].filter(Boolean);
  if (values.length === 0) return null;
  return prisma.leadSuppression.findFirst({ where: { value: { in: values } } });
}

export async function ingestCompany(input: CompanyInput, options?: { isSample?: boolean }) {
  const config = await getResearchConfig();
  const evaluation = evaluateCompany(input, config);
  if (!evaluation.accept) {
    return { ok: false as const, error: evaluation.exclusionReason ?? "This company is outside the target markets." };
  }

  const existing = await prisma.leadCompany.findUnique({
    where: { dedupeKey: evaluation.dedupeKey },
    include: { markets: true },
  });
  const totalCompanies = await prisma.leadCompany.count();
  const suppression = await suppressionMatches(input);

  if (evaluation.outsidePipelines) {
    const decision = acceptanceDecision({
      config,
      market: null,
      isNewCompany: !existing,
      isNewMarketMembership: false,
      companiesInMarket: 0,
      totalCompanies,
    });
    if (!existing && !decision.accept) return { ok: false as const, error: decision.reason };
  }

  for (const market of evaluation.markets) {
    const companiesInMarket = await prisma.leadCompanyMarket.count({ where: { market: market.market } });
    const decision = acceptanceDecision({
      config,
      market: market.market,
      isNewCompany: !existing,
      isNewMarketMembership: !existing?.markets.some((row) => row.market === market.market),
      companiesInMarket,
      totalCompanies,
    });
    if (!decision.accept) return { ok: false as const, error: decision.reason };
  }

  const suppressed = Boolean(suppression);
  const data = {
    name: input.name.trim(),
    website: input.website.trim(),
    country: input.headquartersCountry.trim(),
    region: input.headquartersRegion.trim(),
    city: input.headquartersCity.trim(),
    headquartersLocation: evaluation.headquartersLocation,
    operatingLocations: operatingLocationsJson(input),
    locationEvidence: input.locationEvidence.trim(),
    locationSourceUrl: input.locationSourceUrl.trim(),
    locationStatus: evaluation.locationStatus,
    shipsTo: input.shipsTo.map((item) => item.trim()).filter(Boolean),
    suppressed,
    suppressionReason: suppression?.reason ?? null,
    isSample: options?.isSample ?? existing?.isSample ?? false,
    lastVerifiedAt: evaluation.locationStatus === "VERIFIED" ? new Date() : null,
  };

  const company = existing
    ? await prisma.leadCompany.update({ where: { id: existing.id }, data })
    : await prisma.leadCompany.create({ data: { ...data, dedupeKey: evaluation.dedupeKey } });

  for (const market of evaluation.markets) {
    await prisma.leadCompanyMarket.upsert({
      where: { companyId_market: { companyId: company.id, market: market.market } },
      update: {
        eligible: market.eligible,
        qualified: market.qualified && !suppressed,
        reason: suppressed ? `Suppressed: ${suppression?.reason}` : market.reason,
        sellingMarketLocation: market.sellingMarketLocation,
        targetMarketplace: market.targetMarketplace,
        marketplaceEvidence: market.marketplaceEvidence,
        opportunity: market.opportunity,
        leadScore: market.leadScore,
        priority: suppressed ? "DISQUALIFIED" : market.priority,
        recommendedServiceSlug: market.recommendedServiceSlug,
        recommendedServiceName: market.recommendedServiceName,
      },
      create: {
        companyId: company.id,
        market: market.market,
        eligible: market.eligible,
        qualified: market.qualified && !suppressed,
        reason: suppressed ? `Suppressed: ${suppression?.reason}` : market.reason,
        sellingMarketLocation: market.sellingMarketLocation,
        targetMarketplace: market.targetMarketplace,
        marketplaceEvidence: market.marketplaceEvidence,
        opportunity: market.opportunity,
        leadScore: market.leadScore,
        priority: suppressed ? "DISQUALIFIED" : market.priority,
        recommendedServiceSlug: market.recommendedServiceSlug,
        recommendedServiceName: market.recommendedServiceName,
      },
    });
  }

  await prisma.leadContact.deleteMany({ where: { companyId: company.id } });
  if (evaluation.contacts.length > 0) {
    await prisma.leadContact.createMany({
      data: evaluation.contacts.map((contact) => ({
        companyId: company.id,
        name: contact.name,
        title: contact.title,
        profileUrl: contact.profileUrl || null,
        email: contact.email || null,
        verificationStatus: contact.verificationStatus,
        relevant: contact.relevant,
        optedOut: emailsSuppressed(contact.email, suppression),
      })),
    });
  }

  const sources = [
    ...input.sourceUrls,
    ...(input.locationSourceUrl.trim()
      ? [{ url: input.locationSourceUrl.trim(), label: "Location evidence" }]
      : []),
  ];
  await prisma.leadSource.deleteMany({ where: { companyId: company.id } });
  if (sources.length > 0) {
    await prisma.leadSource.createMany({
      data: sources
        .filter((source) => source.url.trim())
        .map((source) => ({ companyId: company.id, url: source.url.trim(), label: source.label.trim() || "Source" })),
    });
  }

  const saved = await getLeadCompany(company.id);
  return { ok: true as const, company: saved, evaluation };
}

function emailsSuppressed(email: string, suppression: { kind: string; value: string } | null) {
  if (!email || !suppression) return false;
  return suppression.kind === "EMAIL" && suppression.value.toLowerCase() === email.toLowerCase();
}

export async function suppressCompany(id: string, reason: string) {
  const company = await prisma.leadCompany.findUnique({ where: { id } });
  if (!company) return null;
  const domain = websiteHostname(company.website);
  if (domain) {
    await prisma.leadSuppression.upsert({
      where: { kind_value: { kind: "DOMAIN", value: domain } },
      update: { reason },
      create: { kind: "DOMAIN", value: domain, reason },
    });
  }
  await prisma.leadCompany.update({
    where: { id },
    data: { suppressed: true, suppressionReason: reason },
  });
  await prisma.leadCompanyMarket.updateMany({
    where: { companyId: id },
    data: { qualified: false, priority: "DISQUALIFIED", reason: `Suppressed: ${reason}` },
  });
  return getLeadCompany(id);
}

export async function optOutContact(contactId: string, reason: string) {
  const contact = await prisma.leadContact.findUnique({ where: { id: contactId } });
  if (!contact) return null;
  if (contact.email) {
    await prisma.leadSuppression.upsert({
      where: { kind_value: { kind: "EMAIL", value: contact.email.toLowerCase() } },
      update: { reason },
      create: { kind: "EMAIL", value: contact.email.toLowerCase(), reason },
    });
  }
  await prisma.leadContact.update({ where: { id: contactId }, data: { optedOut: true } });
  return contact;
}

export function marketsOf(company: LeadCompanyRecord, market?: LeadMarketId) {
  return company.markets.filter((row) => !market || row.market === market);
}

export function formatOperatingLocations(value: Prisma.JsonValue) {
  if (!Array.isArray(value)) return "";
  return value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return "";
      const record = item as Record<string, unknown>;
      const place = [record.city, record.region, record.country].filter((part): part is string => typeof part === "string" && part.trim().length > 0);
      if (place.length === 0) return "";
      return `${place.join(", ")} (${record.substantialEcommerce ? "substantial ecommerce" : "listed location"})`;
    })
    .filter(Boolean)
    .join("; ");
}

export function leadExportRows(companies: LeadCompanyRecord[], market: LeadMarketId | "ALL") {
  const rows: Record<string, string | number>[] = [];
  for (const company of companies) {
    const selected = market === "ALL" ? company.markets : company.markets.filter((row) => row.market === market);
    if (selected.length === 0) continue;
    const contact = company.contacts.find((item) => item.relevant && !item.optedOut) ?? company.contacts[0];
    for (const row of selected) {
      rows.push({
        Market: row.market === "US" ? "United States" : "Dubai, UAE",
        Company: company.name,
        Country: company.country,
        "Emirate or US state": company.region,
        City: company.city,
        "Headquarters location": company.headquartersLocation,
        "Operating locations": formatOperatingLocations(company.operatingLocations),
        Website: company.website,
        "Target marketplace": row.targetMarketplace,
        "Marketplace evidence": row.marketplaceEvidence,
        "Decision-maker": contact?.name ?? "",
        Title: contact?.title ?? "",
        "Profile URL": contact?.profileUrl ?? "",
        "Business email": contact?.optedOut ? "" : (contact?.email ?? ""),
        "Contact verification": contact?.verificationStatus ?? "",
        Opportunity: row.opportunity,
        "Lead score": row.leadScore,
        Priority: row.priority,
        "Recommended service": row.recommendedServiceName,
        "Location status": company.locationStatus,
        "Location evidence": company.locationEvidence,
        "Source URLs": company.sources.map((source) => source.url).join(" "),
        "Date last verified": company.lastVerifiedAt ? company.lastVerifiedAt.toISOString().slice(0, 10) : "",
        Qualified: row.qualified ? "Yes" : "No",
        Suppressed: company.suppressed ? "Yes" : "No",
      });
    }
  }
  return rows;
}

export async function seedSampleLeads() {
  const { sampleCompanies } = await import("./fixtures");
  for (const sample of sampleCompanies) {
    const result = await ingestCompany(sample.input, { isSample: true });
    if (!result.ok) throw new Error(result.error);
  }
}

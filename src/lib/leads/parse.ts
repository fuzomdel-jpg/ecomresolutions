import type { CompanyInput, ContactVerificationStatus, ResearchConfig } from "./types";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function parseCompanyInput(body: unknown): { ok: true; value: CompanyInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Company details are required." };
  const record = body as Record<string, unknown>;
  const status = text(record.contactVerification);
  const verificationStatus: ContactVerificationStatus =
    status === "VERIFIED" || status === "PUBLIC_LISTING" || status === "UNVERIFIED" ? status : "UNVERIFIED";
  const operatingCountry = text(record.operatingCountry);
  const value: CompanyInput = {
    name: text(record.name),
    website: text(record.website),
    headquartersCountry: text(record.headquartersCountry),
    headquartersRegion: text(record.headquartersRegion),
    headquartersCity: text(record.headquartersCity),
    headquartersLocation: text(record.headquartersLocation),
    operatingLocations: operatingCountry
      ? [
          {
            country: operatingCountry,
            region: text(record.operatingRegion),
            city: text(record.operatingCity),
            substantialEcommerce: record.substantialEcommerce === true || record.substantialEcommerce === "true",
          },
        ]
      : [],
    locationEvidence: text(record.locationEvidence),
    locationSourceUrl: text(record.locationSourceUrl),
    marketplaces: text(record.marketplace)
      ? [{ marketplace: text(record.marketplace), evidence: text(record.marketplaceEvidence) }]
      : [],
    shipsTo: text(record.shipsTo)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    opportunity: text(record.opportunity),
    decisionMakers: text(record.contactName)
      ? [
          {
            name: text(record.contactName),
            title: text(record.contactTitle),
            profileUrl: text(record.profileUrl),
            email: text(record.email),
            verificationStatus,
          },
        ]
      : [],
    sourceUrls: text(record.sourceUrl) ? [{ url: text(record.sourceUrl), label: text(record.sourceLabel) || "Source" }] : [],
  };
  if (!value.name || !value.website) return { ok: false, error: "Company name and website are required." };
  if (!value.headquartersCountry) return { ok: false, error: "Headquarters country is required." };
  return { ok: true, value };
}

export function parseResearchSettings(body: unknown): Partial<ResearchConfig> {
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const enabledMarkets = (["US", "DUBAI"] as const).filter((market) => record[market === "US" ? "usEnabled" : "dubaiEnabled"] !== false);
  return {
    enabledMarkets,
    batchSizePerMarket: Number(record.batchSizePerMarket),
    maxCompaniesPerRun: Number(record.maxCompaniesPerRun),
    maxContactsPerCompany: Number(record.maxContactsPerCompany),
    additionalCountries: text(record.additionalCountries)
      .split(",")
      .map((country) => country.trim())
      .filter(Boolean),
  };
}

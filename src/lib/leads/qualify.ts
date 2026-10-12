import {
  DEFAULT_RESEARCH_CONFIG,
  type CompanyEvaluation,
  type CompanyInput,
  type ContactVerificationStatus,
  type DecisionMakerInput,
  type LeadMarketId,
  type MarketAssessment,
  type NormalizedContact,
  type OperatingLocation,
  type PriorityBand,
  type ResearchConfig,
} from "./types";

const US_COUNTRIES = new Set(["united states", "united states of america", "usa", "us"]);
const UAE_COUNTRIES = new Set(["united arab emirates", "uae"]);

const RELEVANT_TITLE =
  /\b(founder|co-founder|cofounder|owner|ceo|chief executive|president|managing director|general manager|head of e-?commerce|director of e-?commerce|e-?commerce director|e-?commerce manager|marketplace director|marketplace manager|head of digital commerce|head of digital transformation|head of online sales|catalog operations manager|catalog manager|product content manager)\b/i;

export function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/&/g, " and ")
    .replace(/\s+/g, " ");
}

export function isUnitedStates(country: string) {
  return US_COUNTRIES.has(normalizeText(country));
}

export function isUnitedArabEmirates(country: string) {
  return UAE_COUNTRIES.has(normalizeText(country));
}

export function isDubaiPlace(region: string, city: string) {
  return normalizeText(region) === "dubai" || normalizeText(city) === "dubai";
}

export function websiteHostname(website: string) {
  const trimmed = website.trim();
  if (!trimmed) return "";
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    return new URL(withProtocol).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

export function dedupeKey(name: string, website: string) {
  const host = websiteHostname(website);
  if (host) return `domain:${host}`;
  const normalized = normalizeText(name).replace(/[^a-z0-9]+/g, " ").trim();
  return `name:${normalized}`;
}

function hasSubstantialPresence(locations: OperatingLocation[], match: (location: OperatingLocation) => boolean) {
  return locations.some((location) => location.substantialEcommerce && match(location));
}

export function headquartersInUnitedStates(input: Pick<CompanyInput, "headquartersCountry">) {
  return isUnitedStates(input.headquartersCountry);
}

export function headquartersInDubai(input: Pick<CompanyInput, "headquartersCountry" | "headquartersRegion" | "headquartersCity">) {
  return isUnitedArabEmirates(input.headquartersCountry) && isDubaiPlace(input.headquartersRegion, input.headquartersCity);
}

export function operatesInUnitedStates(input: Pick<CompanyInput, "operatingLocations">) {
  return hasSubstantialPresence(input.operatingLocations, (location) => isUnitedStates(location.country));
}

export function operatesInDubai(input: Pick<CompanyInput, "operatingLocations">) {
  return hasSubstantialPresence(
    input.operatingLocations,
    (location) => isUnitedArabEmirates(location.country) && isDubaiPlace(location.region, location.city),
  );
}

function reliableLocationSource(url: string) {
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.hostname.includes(".");
  } catch {
    return false;
  }
}

export function resolveLocationStatus(input: Pick<CompanyInput, "locationEvidence" | "locationSourceUrl">): "VERIFIED" | "UNVERIFIED" {
  if (!input.locationEvidence.trim() || !reliableLocationSource(input.locationSourceUrl)) return "UNVERIFIED";
  return "VERIFIED";
}

function countryEnabled(country: string, config: ResearchConfig) {
  const normalized = normalizeText(country);
  return config.additionalCountries.some((entry) => normalizeText(entry) === normalized);
}

function marketplaceFor(input: CompanyInput, market: LeadMarketId) {
  const relevant =
    market === "US"
      ? /(amazon us|walmart|ebay us|ebay|shopify|tiktok|independent)/i
      : /(amazon\.ae|amazon ae|noon|shopify|independent|carrefour|namshi)/i;
  const match = input.marketplaces.find((item) => relevant.test(item.marketplace));
  const chosen = match ?? input.marketplaces[0];
  return {
    targetMarketplace: chosen?.marketplace?.trim() || "Not confirmed",
    marketplaceEvidence: input.marketplaces
      .map((item) => [item.marketplace.trim(), item.evidence.trim()].filter(Boolean).join(": "))
      .filter(Boolean)
      .join(" | "),
  };
}

function recommendService(marketplace: string, opportunity: string) {
  const text = `${marketplace} ${opportunity}`.toLowerCase();
  if (text.includes("walmart")) {
    if (text.includes("feed")) return { slug: "walmart-feed-fix", name: "Walmart Feed Fix" };
    if (text.includes("content") || text.includes("incomplete") || text.includes("inconsistent")) {
      return { slug: "walmart-product-content-issue", name: "Walmart Product Content Issue" };
    }
    return { slug: "walmart-catalog-fix", name: "Walmart Catalog Fix" };
  }
  if (text.includes("tiktok")) return { slug: "tiktok-shop-catalog-issue", name: "TikTok Shop Catalog Issue" };
  if (text.includes("shopify") && text.includes("feed")) {
    return { slug: "shopify-product-feed-issue", name: "Shopify Product Feed Issue" };
  }
  if (text.includes("amazon") || text.includes("ebay") || text.includes("noon")) {
    if (text.includes("feed")) return { slug: "amazon-feed-flat-file-fix", name: "Amazon Feed / Flat File Fix" };
    if (text.includes("bulk") || text.includes("catalog") || text.includes("content")) {
      return { slug: "amazon-bulk-listing-cleanup", name: "Amazon Bulk Listing Cleanup" };
    }
    return { slug: "amazon-catalog-fix", name: "Amazon Catalog Fix" };
  }
  return { slug: "shopify-product-issue", name: "Shopify Product Issue" };
}

function scoreMarket(input: {
  qualified: boolean;
  opportunity: string;
  marketplaceEvidence: string;
  relevantContacts: number;
  verifiedContacts: number;
}) {
  let score = 0;
  if (input.qualified) score += 25;
  if (input.opportunity.trim().length >= 40) score += 20;
  if (input.marketplaceEvidence.trim().length >= 20) score += 15;
  if (/catalog|content|listing|feed|incomplete|inconsistent|suppress/i.test(input.opportunity)) score += 15;
  if (input.relevantContacts > 0) score += 10;
  if (input.verifiedContacts > 0) score += 10;
  if (/shopify|multi-?channel|expand|walmart|amazon/i.test(`${input.opportunity} ${input.marketplaceEvidence}`)) score += 5;
  return Math.min(100, score);
}

function priorityFor(score: number, qualified: boolean, opportunity: string, marketplaceEvidence: string, relevantContacts: number): PriorityBand {
  if (!qualified) return "DISQUALIFIED";
  if (score >= 80 && opportunity.trim().length >= 40 && marketplaceEvidence.trim().length >= 20 && relevantContacts > 0) {
    return "A";
  }
  if (score >= 55) return "B";
  return "C";
}

function assessMarket(input: CompanyInput, market: LeadMarketId, locationStatus: "VERIFIED" | "UNVERIFIED", contacts: NormalizedContact[]): MarketAssessment {
  const geographic =
    market === "US"
      ? headquartersInUnitedStates(input) || operatesInUnitedStates(input)
      : headquartersInDubai(input) || operatesInDubai(input);
  const channels = marketplaceFor(input, market);
  const relevantContacts = contacts.filter((contact) => contact.relevant).length;
  const verifiedContacts = contacts.filter((contact) => contact.relevant && contact.verificationStatus === "VERIFIED").length;
  const qualified = geographic && locationStatus === "VERIFIED";
  const service = recommendService(channels.targetMarketplace, input.opportunity);
  const leadScore = geographic
    ? scoreMarket({
        qualified,
        opportunity: input.opportunity,
        marketplaceEvidence: channels.marketplaceEvidence,
        relevantContacts,
        verifiedContacts,
      })
    : 0;
  let reason = "Qualified from verified headquarters or substantial operating presence.";
  if (!geographic && market === "US") {
    reason = "A US marketplace listing does not establish a United States headquarters or operating presence.";
  } else if (!geographic && market === "DUBAI") {
    reason = "Shipping to the UAE, or a presence elsewhere in the UAE, does not establish a Dubai headquarters or Dubai operation.";
  } else if (locationStatus === "UNVERIFIED") {
    reason = "Location is Unverified. Add evidence from the official website or another reliable business source.";
  }
  return {
    market,
    eligible: geographic,
    qualified,
    reason,
    sellingMarketLocation: market === "US" ? "United States" : "Dubai, United Arab Emirates",
    targetMarketplace: channels.targetMarketplace,
    marketplaceEvidence: channels.marketplaceEvidence,
    opportunity: input.opportunity.trim(),
    leadScore,
    priority: priorityFor(leadScore, qualified, input.opportunity, channels.marketplaceEvidence, relevantContacts),
    recommendedServiceSlug: service.slug,
    recommendedServiceName: service.name,
  };
}

const CONTACT_STATUSES = new Set<ContactVerificationStatus>(["UNVERIFIED", "PUBLIC_LISTING", "VERIFIED"]);

export function normalizeContacts(contacts: DecisionMakerInput[], limit: number): NormalizedContact[] {
  const relevantFirst = contacts
    .map((contact) => {
      const status = CONTACT_STATUSES.has(contact.verificationStatus) ? contact.verificationStatus : "UNVERIFIED";
      return {
        name: contact.name.trim(),
        title: contact.title.trim(),
        profileUrl: (contact.profileUrl ?? "").trim(),
        email: (contact.email ?? "").trim().toLowerCase(),
        verificationStatus: status,
        relevant: RELEVANT_TITLE.test(contact.title),
      };
    })
    .filter((contact) => contact.name && contact.title && contact.relevant);
  return relevantFirst.slice(0, Math.max(1, limit));
}

function headquartersLabel(input: CompanyInput) {
  if (input.headquartersLocation?.trim()) return input.headquartersLocation.trim();
  return [input.headquartersCity, input.headquartersRegion, input.headquartersCountry].map((part) => part.trim()).filter(Boolean).join(", ");
}

export function evaluateCompany(input: CompanyInput, config: ResearchConfig = DEFAULT_RESEARCH_CONFIG): CompanyEvaluation {
  const locationStatus = resolveLocationStatus(input);
  const contacts = normalizeContacts(input.decisionMakers, config.maxContactsPerCompany);
  const usBasis = headquartersInUnitedStates(input) || operatesInUnitedStates(input);
  const dubaiBasis = headquartersInDubai(input) || operatesInDubai(input);
  const markets = (["US", "DUBAI"] as const)
    .filter((market) => config.enabledMarkets.includes(market))
    .filter((market) => (market === "US" ? usBasis : dubaiBasis))
    .map((market) => assessMarket(input, market, locationStatus, contacts));

  const base = {
    dedupeKey: dedupeKey(input.name, input.website),
    locationStatus,
    headquartersLocation: headquartersLabel(input),
    contacts,
  };

  if (markets.length > 0) {
    return { ...base, markets, accept: true, outsidePipelines: false, exclusionReason: null };
  }

  const hq = input.headquartersCountry.trim() || "Unknown";
  if (countryEnabled(hq, config)) {
    return {
      ...base,
      markets: [],
      accept: true,
      outsidePipelines: true,
      exclusionReason: `${hq} is explicitly enabled, but this company has no United States or Dubai operating basis, so it stays out of both pipelines.`,
    };
  }

  return {
    ...base,
    markets: [],
    accept: false,
    outsidePipelines: false,
    exclusionReason: `${hq} is outside the United States and Dubai target markets. Other countries stay excluded until they are explicitly enabled in research settings.`,
  };
}

export function clampResearchConfig(value: Partial<ResearchConfig> | null | undefined): ResearchConfig {
  const batchSizePerMarket = clampInt(value?.batchSizePerMarket, 1, 500, DEFAULT_RESEARCH_CONFIG.batchSizePerMarket);
  const requestedMax = clampInt(value?.maxCompaniesPerRun, 1, 5000, DEFAULT_RESEARCH_CONFIG.maxCompaniesPerRun);
  const enabled = (value?.enabledMarkets ?? DEFAULT_RESEARCH_CONFIG.enabledMarkets).filter(
    (market): market is LeadMarketId => market === "US" || market === "DUBAI",
  );
  return {
    enabledMarkets: enabled.length > 0 ? Array.from(new Set(enabled)) : ["US", "DUBAI"],
    batchSizePerMarket,
    maxCompaniesPerRun: Math.max(requestedMax, batchSizePerMarket),
    maxContactsPerCompany: clampInt(value?.maxContactsPerCompany, 1, 10, DEFAULT_RESEARCH_CONFIG.maxContactsPerCompany),
    additionalCountries: Array.from(
      new Set((value?.additionalCountries ?? []).map((country) => country.trim()).filter(Boolean)),
    ),
  };
}

function clampInt(value: number | undefined, min: number, max: number, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function acceptanceDecision(input: {
  config: ResearchConfig;
  market: LeadMarketId | null;
  isNewCompany: boolean;
  isNewMarketMembership: boolean;
  companiesInMarket: number;
  totalCompanies: number;
}) {
  if (input.market && !input.config.enabledMarkets.includes(input.market)) {
    return { accept: false, reason: `${input.market === "US" ? "United States" : "Dubai"} research is turned off in settings.` };
  }
  if (input.isNewCompany && input.totalCompanies >= input.config.maxCompaniesPerRun) {
    return {
      accept: false,
      reason: `The research run is capped at ${input.config.maxCompaniesPerRun} companies. Raise the limit after quality is validated.`,
    };
  }
  if (input.market && input.isNewMarketMembership && input.companiesInMarket >= input.config.batchSizePerMarket) {
    return {
      accept: false,
      reason: `${input.market === "US" ? "United States" : "Dubai"} has reached its batch size of ${input.config.batchSizePerMarket}.`,
    };
  }
  return { accept: true, reason: "" };
}

export type OutreachGate = {
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "SENT";
  email: string;
  verificationStatus: ContactVerificationStatus;
  optedOut: boolean;
  suppressed: boolean;
};

export function canSendOutreach(input: OutreachGate) {
  if (input.suppressed || input.optedOut) {
    return { ok: false, reason: "This contact is on the suppression list." };
  }
  if (input.status !== "APPROVED") {
    return { ok: false, reason: "A person must approve this draft before it can be sent." };
  }
  if (!input.email || !input.email.includes("@")) {
    return { ok: false, reason: "A publicly listed business email is required before sending." };
  }
  if (input.verificationStatus === "UNVERIFIED") {
    return { ok: false, reason: "The business email is still unverified." };
  }
  return { ok: true, reason: "" };
}

export function buildOutreachDraft(input: {
  companyName: string;
  contactName: string;
  marketplace: string;
  opportunity: string;
  sellingMarketLocation: string;
}) {
  const first = input.contactName.trim().split(/\s+/)[0] || "there";
  const subject = `${input.marketplace} catalog notes for ${input.companyName}`;
  const body = [
    `Hi ${first},`,
    "",
    `I was looking at ${input.companyName}'s public ${input.marketplace} presence for ${input.sellingMarketLocation}.`,
    input.opportunity.trim() || "Some product content looks incomplete relative to the rest of the catalog.",
    "",
    "Ecom Resolutions can diagnose the listing, catalog, or feed issues and send a written resolution plan before any ongoing work.",
    "",
    "If this is relevant, I can share the specific examples.",
  ].join("\n");
  return { subject, body };
}

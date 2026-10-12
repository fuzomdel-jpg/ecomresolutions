export const LEAD_MARKETS = ["US", "DUBAI"] as const;
export type LeadMarketId = (typeof LEAD_MARKETS)[number];

export type LocationStatus = "VERIFIED" | "UNVERIFIED";
export type ContactVerificationStatus = "UNVERIFIED" | "PUBLIC_LISTING" | "VERIFIED";
export type PriorityBand = "A" | "B" | "C" | "DISQUALIFIED";
export type OutreachStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "SENT";

export type ResearchConfig = {
  enabledMarkets: LeadMarketId[];
  batchSizePerMarket: number;
  maxCompaniesPerRun: number;
  maxContactsPerCompany: number;
  /** Countries outside the United States and Dubai that research may store. Empty by default. */
  additionalCountries: string[];
};

export type OperatingLocation = {
  country: string;
  region: string;
  city: string;
  substantialEcommerce: boolean;
};

export type MarketplacePresence = {
  marketplace: string;
  evidence: string;
};

export type DecisionMakerInput = {
  name: string;
  title: string;
  profileUrl?: string;
  email?: string;
  verificationStatus: ContactVerificationStatus;
};

export type CompanyInput = {
  name: string;
  website: string;
  headquartersCountry: string;
  headquartersRegion: string;
  headquartersCity: string;
  headquartersLocation?: string;
  operatingLocations: OperatingLocation[];
  locationEvidence: string;
  locationSourceUrl: string;
  marketplaces: MarketplacePresence[];
  shipsTo: string[];
  opportunity: string;
  decisionMakers: DecisionMakerInput[];
  sourceUrls: { url: string; label: string }[];
};

export type NormalizedContact = {
  name: string;
  title: string;
  profileUrl: string;
  email: string;
  verificationStatus: ContactVerificationStatus;
  relevant: boolean;
};

export type MarketAssessment = {
  market: LeadMarketId;
  eligible: boolean;
  qualified: boolean;
  reason: string;
  sellingMarketLocation: string;
  targetMarketplace: string;
  marketplaceEvidence: string;
  opportunity: string;
  leadScore: number;
  priority: PriorityBand;
  recommendedServiceSlug: string;
  recommendedServiceName: string;
};

export type CompanyEvaluation = {
  dedupeKey: string;
  locationStatus: LocationStatus;
  headquartersLocation: string;
  contacts: NormalizedContact[];
  markets: MarketAssessment[];
  /** False when the company is outside both target markets and its country is not explicitly enabled. */
  accept: boolean;
  /** True when an explicitly enabled country is stored for reference and kept out of both pipelines. */
  outsidePipelines: boolean;
  exclusionReason: string | null;
};

export const DEFAULT_RESEARCH_CONFIG: ResearchConfig = {
  enabledMarkets: ["US", "DUBAI"],
  batchSizePerMarket: 50,
  maxCompaniesPerRun: 100,
  maxContactsPerCompany: 3,
  additionalCountries: [],
};

export const US_MARKETPLACES = [
  "Amazon US",
  "Walmart Marketplace",
  "eBay US",
  "Shopify",
  "Independent website",
  "TikTok Shop US",
] as const;

export const DUBAI_MARKETPLACES = [
  "Amazon.ae",
  "Shopify",
  "Independent website",
  "Noon",
  "Other regional marketplace",
] as const;

export const US_DECISION_MAKER_TITLES = [
  "Founder / Co-Founder",
  "Owner / CEO / President",
  "Head or Director of Ecommerce",
  "Marketplace Director / Marketplace Manager",
  "Head of Digital Commerce",
  "Catalog Operations Manager",
  "Product Content Manager",
] as const;

export const DUBAI_DECISION_MAKER_TITLES = [
  "Founder / Owner / Managing Director",
  "CEO / General Manager",
  "Head of Ecommerce",
  "Ecommerce Manager",
  "Head of Digital Transformation",
  "Marketplace Manager",
  "Head of Online Sales",
  "Catalog or Product Content Manager",
] as const;

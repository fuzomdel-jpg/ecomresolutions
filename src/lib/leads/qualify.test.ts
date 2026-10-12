import assert from "node:assert/strict";
import { test } from "node:test";
import { pipelineStats, toCsv, toXlsx } from "./pipeline";
import {
  acceptanceDecision,
  buildOutreachDraft,
  canSendOutreach,
  clampResearchConfig,
  dedupeKey,
  evaluateCompany,
} from "./qualify";
import { DEFAULT_RESEARCH_CONFIG, type CompanyInput } from "./types";

function company(overrides: Partial<CompanyInput> = {}): CompanyInput {
  return {
    name: "Northline Goods",
    website: "https://www.northline.example",
    headquartersCountry: "United States",
    headquartersRegion: "Ohio",
    headquartersCity: "Columbus",
    operatingLocations: [],
    locationEvidence: "The official site lists a Columbus, Ohio address.",
    locationSourceUrl: "https://northline.example/contact",
    marketplaces: [{ marketplace: "Amazon US", evidence: "Public seller storefront with missing attributes." }],
    shipsTo: ["United States"],
    opportunity: "Product content is incomplete across a large home catalog that also sells on Shopify.",
    decisionMakers: [
      {
        name: "Riley Chen",
        title: "Head of Ecommerce",
        profileUrl: "https://northline.example/team",
        email: "riley@northline.example",
        verificationStatus: "VERIFIED",
      },
    ],
    sourceUrls: [{ url: "https://northline.example/contact", label: "Contact" }],
    ...overrides,
  };
}

test("default research limits are 50 companies per market and 100 overall", () => {
  const config = clampResearchConfig(undefined);
  assert.deepEqual(config.enabledMarkets, ["US", "DUBAI"]);
  assert.equal(config.batchSizePerMarket, 50);
  assert.equal(config.maxCompaniesPerRun, 100);
  assert.equal(config.maxContactsPerCompany, 3);
  assert.deepEqual(config.additionalCountries, []);
});

test("Amazon US alone does not make a foreign company a US prospect", () => {
  const result = evaluateCompany(
    company({
      name: "Delhi Goods",
      website: "https://delhigoods.example",
      headquartersCountry: "India",
      headquartersRegion: "Karnataka",
      headquartersCity: "Bengaluru",
      marketplaces: [{ marketplace: "Amazon US", evidence: "Seller storefront is public." }],
      shipsTo: ["United States"],
      operatingLocations: [],
    }),
  );
  assert.equal(result.accept, false);
  assert.equal(result.markets.length, 0);
  assert.match(result.exclusionReason ?? "", /India/);
});

test("an explicitly enabled country stays out of both pipelines without a local operation", () => {
  const result = evaluateCompany(
    company({
      headquartersCountry: "India",
      headquartersRegion: "Karnataka",
      headquartersCity: "Bengaluru",
      operatingLocations: [],
    }),
    { ...DEFAULT_RESEARCH_CONFIG, additionalCountries: ["India"] },
  );
  assert.equal(result.accept, true);
  assert.equal(result.outsidePipelines, true);
  assert.equal(result.markets.length, 0);
});

test("verified US headquarters qualifies separately from the selling market", () => {
  const result = evaluateCompany(company());
  assert.equal(result.locationStatus, "VERIFIED");
  assert.equal(result.markets.length, 1);
  assert.equal(result.markets[0]?.market, "US");
  assert.equal(result.markets[0]?.qualified, true);
  assert.equal(result.markets[0]?.sellingMarketLocation, "United States");
  assert.equal(result.markets[0]?.priority, "A");
  assert.equal(result.headquartersLocation.includes("Columbus"), true);
});

test("missing location evidence is labeled Unverified and is not qualified", () => {
  const result = evaluateCompany(company({ locationEvidence: "", locationSourceUrl: "" }));
  assert.equal(result.locationStatus, "UNVERIFIED");
  assert.equal(result.markets[0]?.qualified, false);
  assert.match(result.markets[0]?.reason ?? "", /Unverified/);
});

test("shipping to the UAE does not create a Dubai prospect", () => {
  const result = evaluateCompany(company({ shipsTo: ["United Arab Emirates", "United States"] }));
  assert.equal(result.markets.some((market) => market.market === "DUBAI"), false);
});

test("Abu Dhabi headquarters without Dubai operations is excluded", () => {
  const result = evaluateCompany(
    company({
      headquartersCountry: "United Arab Emirates",
      headquartersRegion: "Abu Dhabi",
      headquartersCity: "Abu Dhabi",
      marketplaces: [{ marketplace: "Amazon.ae", evidence: "Amazon.ae storefront exists." }],
      shipsTo: ["United Arab Emirates"],
    }),
  );
  assert.equal(result.accept, false);
  assert.match(result.exclusionReason ?? "", /outside the United States and Dubai/);
});

test("Dubai headquarters qualifies for Dubai and keeps headquarters distinct", () => {
  const result = evaluateCompany(
    company({
      name: "Dune Atelier",
      website: "https://duneatelier.example",
      headquartersCountry: "United Arab Emirates",
      headquartersRegion: "Dubai",
      headquartersCity: "Dubai",
      marketplaces: [{ marketplace: "Amazon.ae", evidence: "Missing material attributes on the public brand store." }],
      opportunity: "Incomplete product information across the Dubai catalog needs ongoing content management.",
    }),
  );
  assert.equal(result.markets.length, 1);
  assert.equal(result.markets[0]?.market, "DUBAI");
  assert.equal(result.markets[0]?.qualified, true);
  assert.equal(result.markets[0]?.sellingMarketLocation, "Dubai, United Arab Emirates");
  assert.equal(result.headquartersLocation.includes("Dubai"), true);
});

test("India headquarters with substantial Dubai operations enters only the Dubai pipeline", () => {
  const result = evaluateCompany(
    company({
      headquartersCountry: "India",
      headquartersRegion: "Maharashtra",
      headquartersCity: "Mumbai",
      operatingLocations: [{ country: "United Arab Emirates", region: "Dubai", city: "Dubai", substantialEcommerce: true }],
      marketplaces: [{ marketplace: "Noon", evidence: "Noon Dubai seller profile is missing specifications." }],
    }),
  );
  assert.deepEqual(
    result.markets.map((market) => market.market),
    ["DUBAI"],
  );
  assert.equal(result.markets[0]?.qualified, true);
  assert.equal(result.headquartersLocation.includes("Mumbai"), true);
});

test("companies dedupe on the website domain across both pipelines", () => {
  assert.equal(dedupeKey("Harbor & Pine", "https://www.HarborAndPine.example/about"), dedupeKey("Harbor and Pine LLC", "harborandpine.example"));
});

test("decision-makers are capped at the configured limit", () => {
  const result = evaluateCompany(
    company({
      decisionMakers: [
        { name: "One", title: "Founder", verificationStatus: "VERIFIED" },
        { name: "Two", title: "CEO", verificationStatus: "VERIFIED" },
        { name: "Three", title: "Marketplace Manager", verificationStatus: "PUBLIC_LISTING" },
        { name: "Four", title: "Owner", verificationStatus: "VERIFIED" },
        { name: "Intern", title: "Intern", verificationStatus: "UNVERIFIED" },
      ],
    }),
    { ...DEFAULT_RESEARCH_CONFIG, maxContactsPerCompany: 3 },
  );
  assert.equal(result.contacts.length, 3);
  assert.equal(result.contacts.some((contact) => contact.name === "Four"), false);
  assert.equal(result.contacts.some((contact) => contact.title === "Intern"), false);
});

test("batch size and total company cap can be raised after validation", () => {
  const config = clampResearchConfig({ batchSizePerMarket: 80, maxCompaniesPerRun: 40, maxContactsPerCompany: 3 });
  assert.equal(config.batchSizePerMarket, 80);
  assert.equal(config.maxCompaniesPerRun, 80);
  const blocked = acceptanceDecision({
    config,
    market: "US",
    isNewCompany: true,
    isNewMarketMembership: true,
    companiesInMarket: 80,
    totalCompanies: 10,
  });
  assert.equal(blocked.accept, false);
  const allowed = acceptanceDecision({
    config: clampResearchConfig({ batchSizePerMarket: 100, maxCompaniesPerRun: 200 }),
    market: "DUBAI",
    isNewCompany: true,
    isNewMarketMembership: true,
    companiesInMarket: 80,
    totalCompanies: 90,
  });
  assert.equal(allowed.accept, true);
});

test("outreach cannot send until a person approves it", () => {
  const draft = buildOutreachDraft({
    companyName: "Harbor & Pine",
    contactName: "Avery Lang",
    marketplace: "Amazon US",
    opportunity: "Missing attributes on the public catalog.",
    sellingMarketLocation: "United States",
  });
  assert.match(draft.subject, /Harbor & Pine/);
  const pending = canSendOutreach({
    status: "DRAFT",
    email: "avery@harborandpine.example",
    verificationStatus: "VERIFIED",
    optedOut: false,
    suppressed: false,
  });
  assert.equal(pending.ok, false);
  const approved = canSendOutreach({
    status: "APPROVED",
    email: "avery@harborandpine.example",
    verificationStatus: "VERIFIED",
    optedOut: false,
    suppressed: false,
  });
  assert.equal(approved.ok, true);
  const suppressed = canSendOutreach({
    status: "APPROVED",
    email: "avery@harborandpine.example",
    verificationStatus: "VERIFIED",
    optedOut: true,
    suppressed: false,
  });
  assert.equal(suppressed.ok, false);
});

test("pipeline counts keep suppressed companies out of qualified and priority totals", () => {
  const stats = pipelineStats([
    {
      suppressed: false,
      qualified: true,
      priority: "A",
      marketplaceEvidence: "Amazon US storefront",
      opportunity: "Incomplete content",
      contacts: [{ relevant: true, verificationStatus: "VERIFIED", optedOut: false }],
    },
    {
      suppressed: true,
      qualified: true,
      priority: "A",
      marketplaceEvidence: "Amazon US storefront",
      opportunity: "Incomplete content",
      contacts: [{ relevant: true, verificationStatus: "VERIFIED", optedOut: false }],
    },
    {
      suppressed: false,
      qualified: false,
      priority: "DISQUALIFIED",
      marketplaceEvidence: "",
      opportunity: "",
      contacts: [],
    },
  ]);
  assert.equal(stats.discovered, 3);
  assert.equal(stats.qualified, 1);
  assert.equal(stats.decisionMakers, 1);
  assert.equal(stats.verifiedContacts, 1);
  assert.equal(stats.marketplaceOpportunities, 1);
  assert.equal(stats.priorityA, 1);
});

test("csv and xlsx exports include geographic columns", () => {
  const rows = [
    {
      Market: "US",
      Company: "Harbor & Pine",
      Country: "United States",
      "Emirate or US state": "Oregon",
      Opportunity: "Quotes, commas, and\nline breaks",
    },
  ];
  const csv = toCsv(rows);
  assert.match(csv, /Emirate or US state/);
  assert.match(csv, /"Quotes, commas, and\nline breaks"/);
  const xlsx = toXlsx(rows);
  assert.equal(xlsx.subarray(0, 2).toString(), "PK");
  assert.match(xlsx.toString("utf8"), /Harbor &amp; Pine/);
});

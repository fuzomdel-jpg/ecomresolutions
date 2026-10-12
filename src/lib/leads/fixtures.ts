import type { CompanyInput } from "./types";

const catalogOpportunity =
  "Public listings show incomplete product attributes and inconsistent titles across a catalog large enough to need ongoing content management.";

export const sampleCompanies: { key: string; input: CompanyInput }[] = [
  {
    key: "harbor",
    input: {
      name: "Harbor & Pine",
      website: "https://harborandpine.example",
      headquartersCountry: "United States",
      headquartersRegion: "Oregon",
      headquartersCity: "Portland",
      operatingLocations: [],
      locationEvidence: "Contact page lists the Portland, Oregon headquarters.",
      locationSourceUrl: "https://harborandpine.example/contact",
      marketplaces: [
        { marketplace: "Shopify", evidence: "Independent storefront at harborandpine.example." },
        { marketplace: "Amazon US", evidence: "Public Amazon US storefront with missing bullet attributes on several SKUs." },
      ],
      shipsTo: ["United States"],
      opportunity: catalogOpportunity,
      decisionMakers: [
        {
          name: "Avery Lang",
          title: "Founder",
          profileUrl: "https://harborandpine.example/about",
          email: "avery@harborandpine.example",
          verificationStatus: "VERIFIED",
        },
      ],
      sourceUrls: [{ url: "https://harborandpine.example/about", label: "About page" }],
    },
  },
  {
    key: "mesa",
    input: {
      name: "Mesa Supply Co",
      website: "https://mesasupply.example",
      headquartersCountry: "United States",
      headquartersRegion: "Texas",
      headquartersCity: "Austin",
      operatingLocations: [],
      locationEvidence: "",
      locationSourceUrl: "",
      marketplaces: [{ marketplace: "Walmart Marketplace", evidence: "Public Walmart seller name matches the brand." }],
      shipsTo: ["United States"],
      opportunity: "Item content on Walmart looks thin, but the headquarters address is not published on a reliable source yet.",
      decisionMakers: [
        {
          name: "Jordan Hale",
          title: "Marketplace Manager",
          profileUrl: "https://mesasupply.example/team",
          email: "",
          verificationStatus: "UNVERIFIED",
        },
      ],
      sourceUrls: [{ url: "https://mesasupply.example", label: "Website" }],
    },
  },
  {
    key: "creek",
    input: {
      name: "Creek Goods",
      website: "https://creekgoods.example",
      headquartersCountry: "United States",
      headquartersRegion: "Colorado",
      headquartersCity: "Denver",
      operatingLocations: [],
      locationEvidence: "Footer lists Denver, Colorado as the business address.",
      locationSourceUrl: "https://creekgoods.example",
      marketplaces: [{ marketplace: "eBay US", evidence: "eBay US store with repeated title templates and missing item specifics." }],
      shipsTo: ["United States"],
      opportunity: "Catalog titles are duplicated across variations and item specifics are incomplete.",
      decisionMakers: [
        {
          name: "Sam Ortega",
          title: "Owner",
          profileUrl: "https://creekgoods.example/about",
          email: "sam@creekgoods.example",
          verificationStatus: "PUBLIC_LISTING",
        },
      ],
      sourceUrls: [{ url: "https://creekgoods.example/about", label: "About" }],
    },
  },
  {
    key: "dune",
    input: {
      name: "Dune Atelier",
      website: "https://duneatelier.example",
      headquartersCountry: "United Arab Emirates",
      headquartersRegion: "Dubai",
      headquartersCity: "Dubai",
      operatingLocations: [{ country: "United Arab Emirates", region: "Dubai", city: "Dubai", substantialEcommerce: true }],
      locationEvidence: "Arabic and English about page lists a Dubai Design District studio.",
      locationSourceUrl: "https://duneatelier.example/ar/about",
      marketplaces: [
        { marketplace: "Shopify", evidence: "English storefront with incomplete Arabic product descriptions." },
        { marketplace: "Amazon.ae", evidence: "Amazon.ae brand store shows missing material attributes." },
      ],
      shipsTo: ["United Arab Emirates", "Saudi Arabia"],
      opportunity: catalogOpportunity + " The brand is expanding from its Dubai store into additional GCC marketplaces.",
      decisionMakers: [
        {
          name: "Layla Nasser",
          title: "Managing Director",
          profileUrl: "https://duneatelier.example/team",
          email: "layla@duneatelier.example",
          verificationStatus: "VERIFIED",
        },
      ],
      sourceUrls: [{ url: "https://duneatelier.example/ar/about", label: "Arabic about page" }],
    },
  },
  {
    key: "gulf",
    input: {
      name: "Gulf Home Line",
      website: "https://gulfhomeline.example",
      headquartersCountry: "India",
      headquartersRegion: "Maharashtra",
      headquartersCity: "Mumbai",
      operatingLocations: [{ country: "United Arab Emirates", region: "Dubai", city: "Dubai", substantialEcommerce: true }],
      locationEvidence: "Company profile lists the Mumbai headquarters and a Dubai ecommerce warehouse.",
      locationSourceUrl: "https://gulfhomeline.example/company",
      marketplaces: [{ marketplace: "Noon", evidence: "Noon seller profile for the Dubai operation has incomplete specifications." }],
      shipsTo: ["United Arab Emirates"],
      opportunity: "Dubai catalog content is inconsistent across home SKUs and needs ongoing marketplace management.",
      decisionMakers: [
        {
          name: "Omar Faris",
          title: "Head of Ecommerce",
          profileUrl: "https://gulfhomeline.example/team",
          email: "omar@gulfhomeline.example",
          verificationStatus: "PUBLIC_LISTING",
        },
      ],
      sourceUrls: [{ url: "https://gulfhomeline.example/company", label: "Company profile" }],
    },
  },
];

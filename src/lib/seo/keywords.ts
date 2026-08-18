/**
 * Primary keyword map for Ecom Resolutions.
 * Ranked by commercial intent (problem → paid resolution), not vanity volume.
 * Pages must use these in title, H1/H2, first answer, and FAQ — never as stuffing.
 */
export type KeywordCluster = {
  primary: string;
  secondaries: string[];
  path: string;
  intent: "transactional" | "diagnostic" | "informational";
};

export const keywordClusters: KeywordCluster[] = [
  {
    primary: "amazon listing suppressed",
    secondaries: [
      "amazon listing suppression",
      "fix suppressed amazon listing",
      "search suppressed amazon",
      "amazon listing not showing",
      "inactive amazon listing",
    ],
    path: "/problems/amazon-listing-suppressed",
    intent: "transactional",
  },
  {
    primary: "amazon listing not showing",
    secondaries: ["amazon listing not in search", "amazon product not showing", "amazon indexing issue"],
    path: "/problems/amazon-listing-not-showing",
    intent: "transactional",
  },
  {
    primary: "amazon variation not working",
    secondaries: ["amazon parent child variation", "amazon variation family broken"],
    path: "/problems/amazon-variation-not-working",
    intent: "transactional",
  },
  {
    primary: "walmart product not publishing",
    secondaries: [
      "walmart unpublished items",
      "walmart item setup error",
      "walmart listing not live",
      "walmart catalog error",
    ],
    path: "/problems/walmart-product-not-publishing",
    intent: "transactional",
  },
  {
    primary: "walmart item setup error",
    secondaries: ["walmart item setup failed", "walmart attribute error"],
    path: "/problems/walmart-item-setup-error",
    intent: "transactional",
  },
  {
    primary: "google merchant center product disapproved",
    secondaries: [
      "google shopping product disapproved",
      "merchant center disapproval",
      "google merchant feed error",
      "price mismatch merchant center",
    ],
    path: "/problems/google-merchant-product-disapproved",
    intent: "transactional",
  },
  {
    primary: "shopify variant not working",
    secondaries: ["shopify variants missing", "shopify product variant issue"],
    path: "/problems/shopify-variant-not-working",
    intent: "transactional",
  },
  {
    primary: "tiktok shop product rejected",
    secondaries: ["tiktok shop listing rejected", "tiktok shop product not publishing"],
    path: "/problems/tiktok-shop-product-rejected",
    intent: "transactional",
  },
  {
    primary: "amazon catalog issue",
    secondaries: ["amazon feed error", "amazon flat file error", "amazon browse node"],
    path: "/services",
    intent: "diagnostic",
  },
  {
    primary: "e-commerce listing issues",
    secondaries: [
      "marketplace listing problems",
      "fix amazon walmart shopify listings",
      "product feed errors",
    ],
    path: "/",
    intent: "informational",
  },
];

export const homeSeo = {
  title: "Fix Amazon, Walmart, Shopify & Merchant Center Listing Problems | Ecom Resolutions",
  description:
    "Diagnose and fix Amazon listing suppression, Walmart products not publishing, Shopify variant issues, Google Merchant Center disapprovals, and TikTok Shop rejections. Fixed-price specialist resolution.",
  h1: "What's wrong with your store?",
  answer:
    "Ecom Resolutions diagnoses marketplace listing problems and implements a scoped fix for Amazon, Walmart, Shopify, Google Merchant Center, and TikTok Shop. You describe the issue, we recommend a priced resolution, a specialist works the case, and you receive a written report. Marketplace approval remains subject to each platform's systems and policies.",
};

export function keywordsForPath(path: string) {
  return keywordClusters.filter((cluster) => cluster.path === path || path.startsWith(cluster.path));
}

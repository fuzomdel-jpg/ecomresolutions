import assert from "node:assert/strict";
import { test } from "node:test";
import { fuzzyScore, searchServices } from "./search";

test("fuzzy search matches amazon listing suppressed", () => {
  const results = searchServices("amazon listing suppressed", [
    {
      id: "1",
      slug: "amazon-listing-suppression",
      name: "Amazon Listing Suppression Fix",
      shortDescription: "Reactivate suppressed or inactive Amazon listings.",
      priceCents: 29900,
      priceFrom: false,
      slaLabel: "24–48 hours",
      platformName: "Amazon",
      platformSlug: "amazon",
    },
    {
      id: "2",
      slug: "walmart-product-not-publishing",
      name: "Walmart Product Not Publishing",
      shortDescription: "Unblock products that will not publish to Walmart.",
      priceCents: 29900,
      priceFrom: false,
      slaLabel: "24–48 hours",
      platformName: "Walmart",
      platformSlug: "walmart",
    },
  ]);
  assert.equal(results[0]?.slug, "amazon-listing-suppression");
});

test("fuzzy search matches walmart products not live", () => {
  const score = fuzzyScore("walmart products not live", "Walmart Product Not Publishing Unblock products that will not publish");
  assert.ok(score > 0.35);
});

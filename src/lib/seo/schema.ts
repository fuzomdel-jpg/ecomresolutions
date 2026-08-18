import { appUrl } from "@/lib/env";

export function organizationSchema() {
  const url = appUrl();
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "Ecom Resolutions",
    legalName: "Ecom Resolutions",
    url,
    logo: `${url}/brand/mark.svg`,
    description:
      "Productized e-commerce problem resolution for Amazon, Walmart, Shopify, Google Merchant Center, and TikTok Shop.",
    slogan: "E-commerce problems. Resolved.",
    areaServed: ["US", "GB", "CA", "AU"],
    knowsAbout: [
      "Amazon listing suppression",
      "Walmart product publishing",
      "Google Merchant Center disapprovals",
      "Shopify product variants",
      "TikTok Shop catalog issues",
    ],
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: "149",
      highPrice: "499",
      offerCount: "45",
    },
  };
}

export function faqSchema(faqs: { q: string; a: string }[]) {
  if (!faqs.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  const url = appUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${url}${item.path}`,
    })),
  };
}

export function articleSchema(input: {
  title: string;
  description: string;
  slug: string;
  publishedAt: Date;
  updatedAt: Date;
  author: string;
}) {
  const url = appUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.title,
    description: input.description,
    datePublished: input.publishedAt.toISOString(),
    dateModified: input.updatedAt.toISOString(),
    author: { "@type": "Organization", name: input.author || "Ecom Resolutions" },
    publisher: { "@type": "Organization", name: "Ecom Resolutions", logo: { "@type": "ImageObject", url: `${url}/brand/mark.svg` } },
    mainEntityOfPage: `${url}/blog/${input.slug}`,
  };
}

export function howToSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How Ecom Resolutions works",
    description: "Describe the problem, get a diagnosis and price, pay, then track the case to a written resolution report.",
    step: [
      { "@type": "HowToStep", position: 1, name: "Tell us what's wrong", text: "Describe the listing or catalog issue and attach evidence." },
      { "@type": "HowToStep", position: 2, name: "We diagnose the issue", text: "We classify the likely problem and recommend a fixed-price resolution." },
      { "@type": "HowToStep", position: 3, name: "We fix and verify", text: "A specialist implements in-scope corrections and verifies the changes made." },
      { "@type": "HowToStep", position: 4, name: "You receive the report", text: "You get a written resolution report. Marketplace approval is not guaranteed unless verified." },
    ],
  };
}

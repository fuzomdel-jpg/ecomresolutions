import type { MetadataRoute } from "next";

const sitemap = `${process.env.NEXTAUTH_URL || "https://ecomresolutions.com"}/sitemap.xml`;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/app/", "/admin/", "/api/"] },
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "Amazonbot", allow: "/" },
    ],
    sitemap,
  };
}

import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { appUrl } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = appUrl();
  const [services, problems, articles] = await Promise.all([
    prisma.service.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.problemPage.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.knowledgeArticle.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
  ]);
  return [
    "",
    "/services",
    "/pricing",
    "/how-it-works",
    "/security",
    "/blog",
  ]
    .map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.8 }))
    .concat(
      services.map((item) => ({ url: `${base}/services/${item.slug}`, lastModified: item.updatedAt, changeFrequency: "weekly" as const, priority: 0.9 })),
      problems.map((item) => ({ url: `${base}/problems/${item.slug}`, lastModified: item.updatedAt, changeFrequency: "weekly" as const, priority: 0.9 })),
      articles.map((item) => ({ url: `${base}/blog/${item.slug}`, lastModified: item.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
    );
}

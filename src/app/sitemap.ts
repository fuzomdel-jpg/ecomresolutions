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
    "/resources",
  ]
    .map((path) => ({ url: `${base}${path}`, lastModified: new Date() }))
    .concat(
      services.map((item) => ({ url: `${base}/services/${item.slug}`, lastModified: item.updatedAt })),
      problems.map((item) => ({ url: `${base}/problems/${item.slug}`, lastModified: item.updatedAt })),
      articles.map((item) => ({ url: `${base}/resources/${item.slug}`, lastModified: item.updatedAt })),
    );
}

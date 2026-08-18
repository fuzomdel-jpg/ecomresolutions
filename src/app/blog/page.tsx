import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { Card } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { prisma } from "@/lib/db";
import { breadcrumbSchema } from "@/lib/seo/schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog: Amazon, Walmart, Shopify & Merchant Center Listing Fixes",
  description:
    "Practical guides on Amazon listing suppression, Walmart products not publishing, Google Merchant Center disapprovals, Shopify variants, and TikTok Shop rejections.",
  alternates: { canonical: "/blog" },
};

export default async function BlogIndexPage() {
  const posts = await prisma.knowledgeArticle.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
  });
  return (
    <PublicShell>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }])} />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Blog", href: "/blog" }]} />
        <h1 className="mt-4 text-3xl font-semibold text-navy">Marketplace listing problems, explained</h1>
        <p className="mt-3 text-muted">
          Direct answers on Amazon listing suppression, Walmart publishing failures, Merchant Center disapprovals, and related catalog issues. We do not guarantee marketplace approval.
        </p>
        <div className="mt-8 space-y-3">
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <Card className="p-5 hover:border-accent">
                <p className="font-medium text-navy">{post.title}</p>
                <p className="mt-1 text-sm text-muted">{post.excerpt}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}

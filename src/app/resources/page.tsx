import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Resources" };

export default async function ResourcesPage() {
  const articles = await prisma.knowledgeArticle.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
  });
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-semibold text-navy">Resources</h1>
        <div className="mt-8 space-y-3">
          {articles.map((article) => (
            <Link key={article.id} href={`/resources/${article.slug}`}>
              <Card className="p-5 hover:border-accent">
                <p className="font-medium text-navy">{article.title}</p>
                <p className="mt-1 text-sm text-muted">{article.excerpt}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  const articles = await prisma.knowledgeArticle.findMany({ orderBy: { updatedAt: "desc" } });
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Blog</h1>
          <p className="mt-1 text-sm text-muted">Write a post, then publish it to Resources.</p>
        </div>
        <Button asChild>
          <Link href="/admin/knowledge/new">New post</Link>
        </Button>
      </div>
      <div className="mt-6 space-y-3">
        {articles.length === 0 ? (
          <Card className="border-dashed p-6 text-sm text-muted">No posts yet. Start with a draft.</Card>
        ) : (
          articles.map((article) => (
            <Link key={article.id} href={`/admin/knowledge/${article.id}`}>
              <Card className="p-4 hover:border-accent">
                <p className="font-medium text-navy">{article.title}</p>
                <p className="text-sm text-muted">
                  {article.published ? "Published" : "Draft"} · /resources/{article.slug}
                </p>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

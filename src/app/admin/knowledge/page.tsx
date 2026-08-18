import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  const articles = await prisma.knowledgeArticle.findMany({ orderBy: { updatedAt: "desc" } });
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Knowledge</h1>
        <Button asChild>
          <Link href="/admin/blog">Open blog editor</Link>
        </Button>
      </div>
      <div className="mt-6 space-y-3">
        {articles.map((article) => (
          <Card key={article.id} className="p-4">
            <p className="font-medium">{article.title}</p>
            <p className="text-sm text-muted">{article.published ? "Published" : "Draft"}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

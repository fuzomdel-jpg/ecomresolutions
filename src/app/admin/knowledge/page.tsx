import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  const articles = await prisma.knowledgeArticle.findMany({ orderBy: { updatedAt: "desc" } });
  return (
    <div>
      <h1 className="text-2xl font-semibold">Knowledge</h1>
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

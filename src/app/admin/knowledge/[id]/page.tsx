import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogEditor } from "@/components/admin/blog-editor";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditKnowledgePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await prisma.knowledgeArticle.findUnique({ where: { id } });
  if (!article) notFound();
  return (
    <div>
      <Link href="/admin/knowledge" className="text-sm text-muted hover:text-navy">
        All posts
      </Link>
      <div className="mt-4">
        <BlogEditor
          initial={{
            id: article.id,
            title: article.title,
            slug: article.slug,
            excerpt: article.excerpt,
            body: article.body,
            published: article.published,
            seoTitle: article.seoTitle === article.title ? "" : article.seoTitle,
            seoDescription: article.seoDescription === article.excerpt ? "" : article.seoDescription,
          }}
        />
      </div>
    </div>
  );
}

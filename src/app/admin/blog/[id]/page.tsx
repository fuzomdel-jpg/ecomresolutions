import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { BlogEditor } from "@/components/admin/blog-editor";

export const dynamic = "force-dynamic";

export default async function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.knowledgeArticle.findUnique({ where: { id } });
  if (!post) notFound();
  return (
    <div>
      <h1 className="text-2xl font-semibold">Edit article</h1>
      <BlogEditor
        post={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          body: post.body,
          authorName: post.authorName,
          keywords: post.keywords,
          published: post.published,
          seoTitle: post.seoTitle,
          seoDescription: post.seoDescription,
        }}
      />
    </div>
  );
}

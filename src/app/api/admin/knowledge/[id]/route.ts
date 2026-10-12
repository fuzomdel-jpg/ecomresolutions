import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth-helpers";
import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { articleError } from "@/lib/knowledge";
import { knowledgeArticleSchema } from "@/lib/validations";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireStaff();
  const { id } = await params;
  try {
    const parsed = knowledgeArticleSchema.parse(await request.json());
    const existing = await prisma.knowledgeArticle.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Post not found." }, { status: 404 });
    const article = await prisma.knowledgeArticle.update({
      where: { id },
      data: {
        title: parsed.title,
        slug: parsed.slug,
        excerpt: parsed.excerpt,
        body: parsed.body,
        published: parsed.published,
        seoTitle: parsed.seoTitle || parsed.title,
        seoDescription: parsed.seoDescription || parsed.excerpt,
        publishedAt: parsed.published && !existing.published ? new Date() : existing.publishedAt,
      },
    });
    await writeAudit({
      actorId: user.id,
      action: parsed.published ? "knowledge.published" : "knowledge.updated",
      entityType: "KnowledgeArticle",
      entityId: article.id,
      metadata: { slug: article.slug, published: article.published },
    });
    return NextResponse.json(article);
  } catch (error) {
    return articleError(error);
  }
}

import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth-helpers";
import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { articleError } from "@/lib/knowledge";
import { knowledgeArticleSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const user = await requireStaff();
  try {
    const parsed = knowledgeArticleSchema.parse(await request.json());
    const article = await prisma.knowledgeArticle.create({
      data: {
        title: parsed.title,
        slug: parsed.slug,
        excerpt: parsed.excerpt,
        body: parsed.body,
        published: parsed.published,
        seoTitle: parsed.seoTitle || parsed.title,
        seoDescription: parsed.seoDescription || parsed.excerpt,
        publishedAt: new Date(),
      },
    });
    await writeAudit({
      actorId: user.id,
      action: parsed.published ? "knowledge.published" : "knowledge.drafted",
      entityType: "KnowledgeArticle",
      entityId: article.id,
      metadata: { slug: article.slug },
    });
    return NextResponse.json(article);
  } catch (error) {
    return articleError(error);
  }
}

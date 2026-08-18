import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { blogSchema } from "@/lib/validations";
import { writeAudit } from "@/lib/audit";
import { slugify } from "@/lib/utils";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  const { id } = await params;
  const parsed = blogSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a title, slug, excerpt, body, and meta description." }, { status: 400 });
  }
  const updated = await prisma.knowledgeArticle.update({
    where: { id },
    data: { ...parsed.data, slug: slugify(parsed.data.slug) },
  });
  await writeAudit({ actorId: user.id, action: "blog.updated", entityType: "KnowledgeArticle", entityId: id });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  const { id } = await params;
  await prisma.knowledgeArticle.delete({ where: { id } });
  await writeAudit({ actorId: user.id, action: "blog.deleted", entityType: "KnowledgeArticle", entityId: id });
  return NextResponse.json({ ok: true });
}

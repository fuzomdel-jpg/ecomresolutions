import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { blogSchema } from "@/lib/validations";
import { writeAudit } from "@/lib/audit";
import { slugify } from "@/lib/utils";

export async function POST(request: Request) {
  const user = await requireAdmin();
  const parsed = blogSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a title, slug, excerpt, body, and meta description." }, { status: 400 });
  }
  const created = await prisma.knowledgeArticle.create({
    data: { ...parsed.data, slug: slugify(parsed.data.slug) },
  });
  await writeAudit({ actorId: user.id, action: "blog.created", entityType: "KnowledgeArticle", entityId: created.id });
  return NextResponse.json(created);
}

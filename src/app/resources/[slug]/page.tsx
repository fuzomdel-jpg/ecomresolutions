import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PublicShell } from "@/components/layout/public-shell";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await prisma.knowledgeArticle.findUnique({ where: { slug } });
  if (!article) return { title: "Resource" };
  return { title: article.seoTitle, description: article.seoDescription };
}

export default async function ResourcePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await prisma.knowledgeArticle.findUnique({ where: { slug } });
  if (!article || !article.published) notFound();
  return (
    <PublicShell>
      <article className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-semibold text-navy">{article.title}</h1>
        <div className="mt-6 whitespace-pre-wrap text-sm leading-7 text-muted">{article.body}</div>
      </article>
    </PublicShell>
  );
}

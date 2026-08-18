import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/layout/public-shell";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { ArticleBody } from "@/components/blog/article-body";
import { ProblemComposer } from "@/components/composer/problem-composer";
import { prisma } from "@/lib/db";
import { articleSchema, breadcrumbSchema } from "@/lib/seo/schema";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.knowledgeArticle.findUnique({ where: { slug } });
  if (!post || !post.published) return { title: "Article" };
  return {
    title: post.seoTitle,
    description: post.seoDescription,
    keywords: post.keywords,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { title: post.seoTitle, description: post.seoDescription, type: "article" },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.knowledgeArticle.findUnique({ where: { slug } });
  if (!post || !post.published) notFound();
  return (
    <PublicShell>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ])}
      />
      <JsonLd
        data={articleSchema({
          title: post.title,
          description: post.seoDescription,
          slug: post.slug,
          publishedAt: post.publishedAt,
          updatedAt: post.updatedAt,
          author: post.authorName,
        })}
      />
      <article className="mx-auto max-w-3xl px-4 py-12">
        <Breadcrumbs
          items={[
            { name: "Home", href: "/" },
            { name: "Blog", href: "/blog" },
            { name: post.title, href: `/blog/${post.slug}` },
          ]}
        />
        <p className="mt-4 text-xs uppercase tracking-[0.16em] text-muted">{post.authorName}</p>
        <h1 className="mt-2 text-3xl font-semibold text-navy">{post.title}</h1>
        <p className="mt-3 text-muted">{post.excerpt}</p>
        <div className="mt-8">
          <ArticleBody body={post.body} />
        </div>
        <div className="mt-12">
          <ProblemComposer heading="Describe this problem if it is happening on your store." />
        </div>
      </article>
    </PublicShell>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const posts = await prisma.knowledgeArticle.findMany({ orderBy: { updatedAt: "desc" } });
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Blog</h1>
        <Button asChild>
          <Link href="/admin/blog/new">Upload article</Link>
        </Button>
      </div>
      <p className="mt-2 text-sm text-muted">Published posts appear on /blog. Drafts stay internal until you publish.</p>
      <div className="mt-6 space-y-3">
        {posts.map((post) => (
          <Link key={post.id} href={`/admin/blog/${post.id}`}>
            <Card className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{post.title}</p>
                <p className="text-sm text-muted">
                  /{post.slug} · {post.published ? "Published" : "Draft"}
                </p>
              </div>
              <span className="text-sm text-accent">Edit</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

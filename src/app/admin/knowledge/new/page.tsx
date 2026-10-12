import Link from "next/link";
import { BlogEditor } from "@/components/admin/blog-editor";

export const dynamic = "force-dynamic";

export default function NewKnowledgePage() {
  return (
    <div>
      <Link href="/admin/knowledge" className="text-sm text-muted hover:text-navy">
        All posts
      </Link>
      <div className="mt-4">
        <BlogEditor />
      </div>
    </div>
  );
}

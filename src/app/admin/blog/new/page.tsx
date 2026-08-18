import { BlogEditor } from "@/components/admin/blog-editor";

export default function NewBlogPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Upload article</h1>
      <BlogEditor />
    </div>
  );
}

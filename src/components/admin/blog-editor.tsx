"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { slugify } from "@/lib/utils";

type Post = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  authorName: string;
  keywords: string[];
  published: boolean;
  seoTitle: string;
  seoDescription: string;
};

const empty: Post = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  authorName: "Ecom Resolutions",
  keywords: [],
  published: false,
  seoTitle: "",
  seoDescription: "",
};

export function BlogEditor({ post }: { post?: Post }) {
  const router = useRouter();
  const [form, setForm] = useState<Post>(post ?? empty);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    setError(null);
    const payload = {
      ...form,
      slug: form.slug || slugify(form.title),
      seoTitle: form.seoTitle || `${form.title} | Ecom Resolutions`,
      keywords: form.keywords.map((item) => item.trim()).filter(Boolean),
    };
    const response = await fetch(form.id ? `/api/admin/blog/${form.id}` : "/api/admin/blog", {
      method: form.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Could not save the article.");
      setPending(false);
      return;
    }
    router.push("/admin/blog");
    router.refresh();
  }

  return (
    <form
      className="mt-6 space-y-3 rounded-2xl border border-border bg-white p-5"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <label className="block text-sm">
        Title
        <Input
          className="mt-1"
          value={form.title}
          onChange={(event) =>
            setForm({
              ...form,
              title: event.target.value,
              slug: form.id ? form.slug : slugify(event.target.value),
            })
          }
          required
        />
      </label>
      <label className="block text-sm">
        Slug
        <Input className="mt-1" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} required />
      </label>
      <label className="block text-sm">
        Excerpt
        <Textarea className="mt-1" value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} required />
      </label>
      <label className="block text-sm">
        Body (use ## for headings, blank lines between paragraphs)
        <Textarea
          className="mt-1 min-h-64"
          value={form.body}
          onChange={(event) => setForm({ ...form, body: event.target.value })}
          required
        />
      </label>
      <label className="block text-sm">
        Keywords (comma separated)
        <Input
          className="mt-1"
          value={form.keywords.join(", ")}
          onChange={(event) =>
            setForm({
              ...form,
              keywords: event.target.value.split(",").map((item) => item.trim()).filter(Boolean),
            })
          }
        />
      </label>
      <label className="block text-sm">
        SEO title
        <Input className="mt-1" value={form.seoTitle} onChange={(event) => setForm({ ...form, seoTitle: event.target.value })} />
      </label>
      <label className="block text-sm">
        Meta description
        <Textarea className="mt-1" value={form.seoDescription} onChange={(event) => setForm({ ...form, seoDescription: event.target.value })} />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} />
        Published
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save article"}
      </Button>
    </form>
  );
}

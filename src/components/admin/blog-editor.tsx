"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { slugify } from "@/lib/utils";

export type BlogDraft = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  published: boolean;
  seoTitle: string;
  seoDescription: string;
};

const emptyDraft: BlogDraft = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  published: false,
  seoTitle: "",
  seoDescription: "",
};

export function BlogEditor({ initial }: { initial?: BlogDraft }) {
  const router = useRouter();
  const [form, setForm] = useState<BlogDraft>(initial ?? emptyDraft);
  const [slugLocked, setSlugLocked] = useState(Boolean(initial?.slug));
  const [pending, setPending] = useState<"draft" | "publish" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewParagraphs = useMemo(
    () => form.body.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean),
    [form.body],
  );

  function updateTitle(title: string) {
    setForm((current) => ({
      ...current,
      title,
      slug: slugLocked ? current.slug : slugify(title),
    }));
  }

  async function save(published: boolean) {
    setPending(published ? "publish" : "draft");
    setError(null);
    const payload = { ...form, published, slug: form.slug || slugify(form.title) };
    const response = await fetch(form.id ? `/api/admin/knowledge/${form.id}` : "/api/admin/knowledge", {
      method: form.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json().catch(() => null)) as { id?: string; slug?: string; error?: string } | null;
    setPending(null);
    if (!response.ok || !data?.id) {
      setError(data?.error ?? "The post could not be saved.");
      return;
    }
    if (!form.id) {
      router.replace(`/admin/knowledge/${data.id}`);
    }
    setForm((current) => ({ ...current, id: data.id, slug: data.slug ?? payload.slug, published }));
    router.refresh();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <form
        className="space-y-4 rounded-2xl border border-dashed border-border bg-white p-5"
        onSubmit={(event) => {
          event.preventDefault();
          void save(form.published);
        }}
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Write</p>
          <h1 className="mt-1 text-2xl font-semibold text-navy">{form.id ? "Edit post" : "New post"}</h1>
          <p className="mt-1 text-sm text-muted">Published posts show on the public Resources page.</p>
        </div>
        <label className="block text-sm text-navy">
          Title
          <Input className="mt-1" value={form.title} onChange={(event) => updateTitle(event.target.value)} placeholder="Headline" />
        </label>
        <label className="block text-sm text-navy">
          Web address
          <Input
            className="mt-1 font-mono"
            value={form.slug}
            onChange={(event) => {
              setSlugLocked(true);
              setForm({ ...form, slug: slugify(event.target.value) });
            }}
            placeholder="post-slug"
          />
          <span className="mt-1 block text-xs text-muted">/resources/{form.slug || "post-slug"}</span>
        </label>
        <label className="block text-sm text-navy">
          Excerpt
          <Textarea
            className="mt-1 min-h-20"
            value={form.excerpt}
            onChange={(event) => setForm({ ...form, excerpt: event.target.value })}
            placeholder="One or two sentences for the list and search description."
          />
        </label>
        <label className="block text-sm text-navy">
          Body
          <Textarea
            className="mt-1 min-h-72"
            value={form.body}
            onChange={(event) => setForm({ ...form, body: event.target.value })}
            placeholder="Write the post. Separate paragraphs with a blank line."
          />
        </label>
        <details className="rounded-xl border border-border px-3 py-2 text-sm">
          <summary className="cursor-pointer font-medium text-navy">Search title and description</summary>
          <label className="mt-3 block text-navy">
            Search title
            <Input
              className="mt-1"
              value={form.seoTitle}
              maxLength={70}
              onChange={(event) => setForm({ ...form, seoTitle: event.target.value })}
              placeholder={form.title || "Uses the headline when left blank"}
            />
          </label>
          <label className="mt-3 block text-navy">
            Search description
            <Textarea
              className="mt-1 min-h-20"
              maxLength={160}
              value={form.seoDescription}
              onChange={(event) => setForm({ ...form, seoDescription: event.target.value })}
              placeholder={form.excerpt || "Uses the excerpt when left blank"}
            />
          </label>
        </details>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={pending !== null} onClick={() => void save(false)}>
            {pending === "draft" ? "Saving…" : form.published ? "Unpublish" : "Save draft"}
          </Button>
          <Button type="button" disabled={pending !== null} onClick={() => void save(true)}>
            {pending === "publish" ? "Publishing…" : form.published ? "Update live post" : "Publish"}
          </Button>
          {form.published && form.slug ? (
            <Button variant="ghost" asChild>
              <a href={`/resources/${form.slug}`} target="_blank" rel="noreferrer">
                View live
              </a>
            </Button>
          ) : null}
        </div>
      </form>

      <aside className="rounded-2xl border border-border bg-[#f4f1ea] p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Page wireframe</p>
        <div className="mt-3 rounded-xl border border-dashed border-[#c8c1b4] bg-white p-4">
          <div className="h-2 w-16 rounded-full bg-[#e7e1d6]" />
          <p className="mt-4 text-lg font-semibold leading-snug text-navy">{form.title || "Headline"}</p>
          <p className="mt-2 text-xs leading-5 text-muted">{form.excerpt || "Excerpt appears under the title on the public page."}</p>
          <div className="mt-4 space-y-3">
            {previewParagraphs.length > 0 ? (
              previewParagraphs.map((paragraph, index) => (
                <p key={`${index}-${paragraph.slice(0, 24)}`} className="whitespace-pre-wrap text-xs leading-5 text-navy">
                  {paragraph}
                </p>
              ))
            ) : (
              <div className="space-y-2">
                <div className="h-2 w-full rounded-full bg-[#efeae1]" />
                <div className="h-2 w-11/12 rounded-full bg-[#efeae1]" />
                <div className="h-2 w-4/5 rounded-full bg-[#efeae1]" />
              </div>
            )}
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">{form.published ? "Live on the site" : "Draft — hidden from the public site"}</p>
      </aside>
    </div>
  );
}

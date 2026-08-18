"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Paperclip, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProblemComposer({
  initialValue = "",
  heading,
  compact = false,
  platformSlug,
  serviceSlug,
}: {
  initialValue?: string;
  heading?: string;
  compact?: boolean;
  platformSlug?: string;
  serviceSlug?: string;
}) {
  const router = useRouter();
  const [text, setText] = useState(initialValue);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function submit() {
    setError(null);
    if (text.trim().length < 8) {
      setError("Tell us a bit more about what happened.");
      return;
    }
    setPending(true);
    try {
      const form = new FormData();
      form.set("problemText", text);
      if (platformSlug) form.set("platformSlug", platformSlug);
      if (serviceSlug) form.set("serviceSlug", serviceSlug);
      files.forEach((file) => form.append("files", file));
      const response = await fetch("/api/intake", { method: "POST", body: form });
      const data = (await response.json()) as { sessionId?: string; error?: string };
      if (!response.ok || !data.sessionId) {
        throw new Error(data.error || "Something went wrong while starting your diagnosis. Please try again.");
      }
      router.push(`/app/new?session=${data.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setPending(false);
    }
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    setFiles((current) => [...current, ...Array.from(list)].slice(0, 8));
  }

  return (
    <div className={compact ? "" : "mx-auto w-full max-w-3xl"}>
      {heading ? <p className="mb-3 text-sm font-medium text-navy">{heading}</p> : null}
      <div
        className="composer-shadow rounded-[28px] border border-border bg-white p-3"
        onPaste={(event) => {
          const pasted = Array.from(event.clipboardData.files);
          if (pasted.length) setFiles((current) => [...current, ...pasted].slice(0, 8));
        }}
      >
        <label htmlFor="problem" className="sr-only">
          Describe the issue
        </label>
        <textarea
          id="problem"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={"Tell us what happened. Example:\nMy Amazon listings were suppressed and I don't know why."}
          className={`w-full resize-none bg-transparent px-3 py-3 text-base text-navy outline-none placeholder:text-muted ${compact ? "min-h-28" : "min-h-40"}`}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              void submit();
            }
          }}
        />
        {files.length ? (
          <ul className="flex flex-wrap gap-2 px-3 pb-2 text-xs text-muted">
            {files.map((file) => (
              <li key={file.name} className="rounded-full bg-accent-soft px-2 py-1 text-navy">
                {file.name}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex items-center justify-between px-1">
          <div>
            <input
              ref={fileRef}
              type="file"
              className="sr-only"
              multiple
              accept=".png,.jpg,.jpeg,.webp,.pdf,.csv,.xlsx,.txt"
              onChange={(event) => addFiles(event.target.files)}
            />
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-muted hover:bg-accent-soft hover:text-navy"
              onClick={() => fileRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
              Attach file or screenshot
            </button>
          </div>
          <Button type="button" onClick={() => void submit()} disabled={pending} className="rounded-full">
            {pending ? "Diagnosing..." : "Send Problem"}
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <p className="mt-3 text-center text-sm text-muted">Takes less than 60 seconds</p>
      {error ? <p className="mt-2 text-center text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

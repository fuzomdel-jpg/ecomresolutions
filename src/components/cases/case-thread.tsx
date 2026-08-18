"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Paperclip, ArrowUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Message = {
  id: string;
  body: string;
  kind: string;
  authorType: string;
  createdAt: string;
  attachments: { id: string; filename: string }[];
};

export function CaseThread({
  caseId,
  messages,
  resolved,
}: {
  caseId: string;
  messages: Message[];
  resolved: boolean;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function send() {
    if (!text.trim() && !fileRef.current?.files?.length) return;
    setPending(true);
    const form = new FormData();
    form.set("body", text);
    if (fileRef.current?.files) {
      Array.from(fileRef.current.files).forEach((file) => form.append("files", file));
    }
    const response = await fetch(`/api/cases/${caseId}/messages`, { method: "POST", body: form });
    if (response.ok) {
      setText("");
      router.refresh();
    }
    setPending(false);
  }

  return (
    <>
      <div className="flex-1 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
              message.authorType === "CUSTOMER"
                ? "ml-auto bg-accent-soft"
                : "mr-auto border border-border bg-white"
            }`}
          >
            <p className="whitespace-pre-wrap">{message.body}</p>
            {message.attachments.map((file) => (
              <Link key={file.id} href={`/api/files/${file.id}`} className="mt-2 block text-xs text-accent">
                {file.filename}
              </Link>
            ))}
          </div>
        ))}
      </div>
      {resolved ? (
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link href={`/app/cases/${caseId}?report=1`}>View Resolution Report</Link>
          </Button>
        </div>
      ) : null}
      <form
        className="sticky bottom-16 mt-4 rounded-2xl border border-border bg-white p-3 md:bottom-4"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <label className="sr-only" htmlFor="reply">
          Reply to Ecom Resolutions
        </label>
        <textarea
          id="reply"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Reply to Ecom Resolutions..."
          className="min-h-16 w-full resize-none bg-transparent text-sm outline-none"
        />
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => fileRef.current?.click()} aria-label="Attach file">
            <Paperclip className="h-4 w-4 text-muted" />
          </button>
          <input ref={fileRef} type="file" multiple className="sr-only" />
          <Button type="submit" size="sm" disabled={pending}>
            Reply <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </>
  );
}

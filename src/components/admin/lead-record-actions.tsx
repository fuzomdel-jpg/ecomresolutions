"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

async function postAction(id: string, payload: Record<string, string>) {
  const response = await fetch(`/api/admin/leads/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(body.error ?? "The action could not be completed.");
}

export function LeadRecordActions({
  companyId,
  drafts,
  contacts,
}: {
  companyId: string;
  drafts: { id: string; status: string; subject: string }[];
  contacts: { id: string; name: string; optedOut: boolean }[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function run(payload: Record<string, string>) {
    setPending(true);
    setError("");
    try {
      await postAction(companyId, payload);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The action could not be completed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={pending} onClick={() => run({ action: "draft" })}>
          Generate outreach draft
        </Button>
        <Button type="button" variant="outline" disabled={pending} onClick={() => run({ action: "suppress", reason: "Suppressed from the lead record" })}>
          Suppress company
        </Button>
      </div>
      {contacts.filter((contact) => !contact.optedOut).map((contact) => (
        <Button key={contact.id} type="button" variant="ghost" size="sm" disabled={pending} onClick={() => run({ action: "opt-out", contactId: contact.id, reason: "Opted out" })}>
          Opt out {contact.name}
        </Button>
      ))}
      <ul className="space-y-3">
        {drafts.map((draft) => (
          <li key={draft.id} className="rounded-xl border border-border p-3">
            <p className="text-sm font-medium">{draft.subject}</p>
            <p className="text-xs text-muted">{draft.status.replaceAll("_", " ")}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {draft.status === "DRAFT" || draft.status === "PENDING_APPROVAL" ? (
                <>
                  <Button type="button" size="sm" disabled={pending} onClick={() => run({ action: "approve", draftId: draft.id })}>
                    Approve
                  </Button>
                  <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => run({ action: "reject", draftId: draft.id, reason: "Rejected in review" })}>
                    Reject
                  </Button>
                </>
              ) : null}
              {draft.status === "APPROVED" ? (
                <Button type="button" size="sm" disabled={pending} onClick={() => run({ action: "send", draftId: draft.id })}>
                  Send approved draft
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

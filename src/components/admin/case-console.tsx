"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CaseStatus, Priority } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { StatusBadge } from "@/components/cases/status-badge";
import { formatUsd } from "@/lib/utils";

const statuses: CaseStatus[] = [
  "NEW",
  "DIAGNOSING",
  "WAITING_FOR_CUSTOMER",
  "IN_PROGRESS",
  "QA",
  "RESOLVED",
  "CLOSED",
  "CANCELLED",
];

export function AdminCaseConsole({
  record,
  team,
  similar,
}: {
  similar: { id: string; caseNumber: string; title: string }[];
  team: { id: string; name: string | null; email: string }[];
  record: {
    id: string;
    caseNumber: string;
    title: string;
    description: string;
    status: CaseStatus;
    priority: Priority;
    priceCents: number;
    slaDueAt: string;
    assignedAgentId: string | null;
    customer: { email: string; name: string | null };
    platform: { name: string };
    service: { name: string };
    messages: { id: string; body: string; authorType: string; createdAt: string }[];
    internalNotes: { id: string; body: string; createdAt: string; author: string }[];
    ai: {
      id: string;
      probableCause: string | null;
      confidence: number | null;
      recommendedServiceSlug: string | null;
      status: string;
    } | null;
    resolution: {
      problem: string;
      rootCause: string;
      actionTaken: string;
      verification: string;
      result: string;
      recommendedPrevention: string;
    } | null;
  };
}) {
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");
  const [report, setReport] = useState({
    problem: record.resolution?.problem ?? record.title,
    rootCause: record.resolution?.rootCause ?? record.ai?.probableCause ?? "",
    actionTaken: record.resolution?.actionTaken ?? "",
    verification: record.resolution?.verification ?? "",
    result: record.resolution?.result ?? "Resolved.",
    recommendedPrevention: record.resolution?.recommendedPrevention ?? "",
  });

  async function post(path: string, body: unknown) {
    await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    router.refresh();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
      <div>
        <p className="text-sm text-muted">
          {record.caseNumber} · {record.customer.email} · {record.platform.name}
        </p>
        <h1 className="text-2xl font-semibold text-navy">{record.title}</h1>
        <div className="mt-2 flex items-center gap-3">
          <StatusBadge status={record.status} />
          <span className="text-sm">{formatUsd(record.priceCents)}</span>
        </div>
        <p className="mt-4 whitespace-pre-wrap text-sm text-muted">{record.description}</p>
        <div className="mt-6 space-y-3">
          {record.messages.map((message) => (
            <Card key={message.id} className="p-4 text-sm">
              <p className="text-xs text-muted">{message.authorType}</p>
              <p className="mt-1 whitespace-pre-wrap">{message.body}</p>
            </Card>
          ))}
        </div>
        <form
          className="mt-4"
          onSubmit={(event) => {
            event.preventDefault();
            void post(`/api/admin/cases/${record.id}/message`, { body: reply });
            setReply("");
          }}
        >
          <Textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Reply to customer" />
          <div className="mt-2 flex gap-2">
            <Button type="submit">Send customer message</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void post(`/api/admin/cases/${record.id}/request-info`, { body: reply || "Please share the latest error report." })}
            >
              Request information
            </Button>
          </div>
        </form>
        <form
          className="mt-8 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            void post(`/api/admin/cases/${record.id}/resolve`, report);
          }}
        >
          <h2 className="font-semibold">Resolution report</h2>
          {Object.entries(report).map(([key, value]) => (
            <label key={key} className="block text-sm">
              {key}
              <Textarea
                className="mt-1"
                value={value}
                onChange={(event) => setReport((current) => ({ ...current, [key]: event.target.value }))}
              />
            </label>
          ))}
          <Button type="submit">Mark resolved & generate report</Button>
        </form>
      </div>
      <div className="space-y-4">
        <Card className="p-4">
          <h2 className="font-semibold">AI Diagnosis</h2>
          <p className="mt-2 text-sm">Likely issue: {record.ai?.probableCause ?? "Pending"}</p>
          <p className="text-sm">Confidence: {record.ai?.confidence != null ? `${Math.round(record.ai.confidence * 100)}%` : "—"}</p>
          <p className="text-sm">Suggested service: {record.ai?.recommendedServiceSlug ?? "—"}</p>
          <p className="mt-2 text-xs text-muted">Never automatically execute risky marketplace changes.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => record.ai && void post(`/api/admin/ai/${record.ai.id}`, { status: "ACCEPTED" })}>
              Accept
            </Button>
            <Button size="sm" variant="outline" onClick={() => record.ai && void post(`/api/admin/ai/${record.ai.id}`, { status: "EDITED" })}>
              Edit
            </Button>
            <Button size="sm" variant="ghost" onClick={() => record.ai && void post(`/api/admin/ai/${record.ai.id}`, { status: "IGNORED" })}>
              Ignore
            </Button>
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="font-semibold">Assignment & status</h2>
          <select
            className="mt-2 h-10 w-full rounded-xl border px-3 text-sm"
            defaultValue={record.assignedAgentId ?? ""}
            onChange={(event) => void post(`/api/admin/cases/${record.id}/assign`, { assignedAgentId: event.target.value })}
          >
            <option value="">Unassigned</option>
            {team.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name || member.email}
              </option>
            ))}
          </select>
          <select
            className="mt-2 h-10 w-full rounded-xl border px-3 text-sm"
            defaultValue={record.status}
            onChange={(event) => void post(`/api/admin/cases/${record.id}/status`, { status: event.target.value })}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Card>
        <Card className="p-4">
          <h2 className="font-semibold">Internal notes</h2>
          <p className="text-xs text-muted">Customers never see this channel.</p>
          <div className="mt-3 space-y-2 text-sm">
            {record.internalNotes.map((item) => (
              <p key={item.id}>
                <span className="font-medium">{item.author}:</span> {item.body}
              </p>
            ))}
          </div>
          <form
            className="mt-3"
            onSubmit={(event) => {
              event.preventDefault();
              void post(`/api/admin/cases/${record.id}/notes`, { body: note });
              setNote("");
            }}
          >
            <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="INTERNAL NOTE" />
            <Button size="sm" className="mt-2" type="submit">
              Add note
            </Button>
          </form>
        </Card>
        <Card className="p-4">
          <h2 className="font-semibold">Similar resolved cases</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {similar.map((item) => (
              <li key={item.id}>
                {item.caseNumber} · {item.title}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

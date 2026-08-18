"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ProblemComposer } from "@/components/composer/problem-composer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatUsd } from "@/lib/utils";
import type { AIDiagnosis } from "@/lib/validations";
import type { IntakeMessage } from "@/lib/ai";

type SessionPayload = {
  id: string;
  status: string;
  messages: IntakeMessage[];
  diagnosis?: AIDiagnosis | null;
  recommendedService?: {
    slug: string;
    name: string;
    shortDescription: string;
    priceCents: number;
    priceFrom: boolean;
    slaLabel: string;
    includedScope: string[];
    excludedScope: string[];
    complexity: string;
    platform: { name: string; slug: string };
  } | null;
};

function IntakeExperience() {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get("session");
  const service = params.get("service") ?? undefined;
  const [data, setData] = useState<SessionPayload | null>(null);
  const [answer, setAnswer] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    void fetch(`/api/intake/${sessionId}`)
      .then((response) => response.json())
      .then(setData);
  }, [sessionId]);

  async function reply(payload: Record<string, unknown>) {
    if (!sessionId) return;
    setPending(true);
    setError(null);
    const response = await fetch(`/api/intake/${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await response.json();
    if (!response.ok) {
      setError(json.error || "Something went wrong. Please try again.");
      setPending(false);
      return;
    }
    setData(json);
    setAnswer("");
    setPending(false);
  }

  if (!sessionId) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-navy">New Resolution</h1>
        <div className="mt-6">
          <ProblemComposer serviceSlug={service} />
        </div>
      </div>
    );
  }

  const question = data?.messages.at(-1)?.questions?.[0];
  const diagnosis = data?.diagnosis || data?.messages.at(-1)?.diagnosis;
  const ready = data?.status === "DIAGNOSED" && data.recommendedService;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-navy">Let&apos;s understand the problem</h1>
      <div className="mt-6 space-y-4">
        {data?.messages.map((message, index) => (
          <div
            key={index}
            className={`rounded-2xl px-4 py-3 text-sm ${message.role === "user" ? "ml-8 bg-accent-soft text-navy" : "mr-8 bg-white border border-border"}`}
          >
            {message.content}
          </div>
        ))}
      </div>
      {question && !ready ? (
        <div className="mt-6">
          <p className="text-sm font-medium text-navy">{question.prompt}</p>
          {question.type === "choice" ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {question.options?.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => void reply({ answers: { [question.id]: option.value } })}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          ) : question.type === "text" ? (
            <form
              className="mt-3 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void reply({ answers: { [question.id]: answer }, message: answer });
              }}
            >
              <input
                className="h-10 flex-1 rounded-full border border-border px-3 text-sm"
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
              />
              <Button type="submit" disabled={pending}>
                Continue
              </Button>
            </form>
          ) : (
            <p className="mt-2 text-sm text-muted">You can attach files from the homepage composer, or skip this.</p>
          )}
          {!question.required ? (
            <button
              type="button"
              className="mt-3 text-sm text-accent"
              onClick={() => void reply({ skip: true })}
            >
              Skip
            </button>
          ) : (
            <button type="button" className="mt-3 text-sm text-muted" onClick={() => void reply({ skip: true })}>
              Skip remaining questions
            </button>
          )}
        </div>
      ) : null}
      {ready && data.recommendedService ? (
        <Card className="mt-8 p-6">
          <h2 className="text-xl font-semibold text-navy">We understand the problem</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted">Platform</dt>
              <dd className="font-medium">{data.recommendedService.platform.name}</dd>
            </div>
            <div>
              <dt className="text-muted">Issue</dt>
              <dd className="font-medium">{diagnosis?.issueCategory ?? data.recommendedService.name}</dd>
            </div>
            <div>
              <dt className="text-muted">Complexity</dt>
              <dd className="font-medium">{data.recommendedService.complexity}</dd>
            </div>
            <div>
              <dt className="text-muted">Typical turnaround</dt>
              <dd className="font-medium">{data.recommendedService.slaLabel}</dd>
            </div>
          </dl>
          <p className="mt-4 font-medium text-navy">{data.recommendedService.name}</p>
          <p className="text-2xl font-semibold text-navy">
            {formatUsd(data.recommendedService.priceCents, data.recommendedService.priceFrom)}
          </p>
          <p className="mt-2 text-sm text-muted">
            Likely issue. Recommended resolution. Subject to platform systems and policies.
          </p>
          <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
            <div>
              <p className="font-medium">Included</p>
              <ul className="mt-1 list-disc pl-4 text-muted">
                {data.recommendedService.includedScope.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium">Not included</p>
              <ul className="mt-1 list-disc pl-4 text-muted">
                {data.recommendedService.excludedScope.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
          <Button className="mt-6" onClick={() => router.push(`/app/checkout?session=${data.id}`)}>
            Continue →
          </Button>
        </Card>
      ) : null}
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

export default function NewProblemPage() {
  return (
    <Suspense>
      <IntakeExperience />
    </Suspense>
  );
}

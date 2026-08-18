"use client";

import { signIn } from "next-auth/react";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { formatUsd } from "@/lib/utils";

function CheckoutInner() {
  const params = useSearchParams();
  const sessionId = params.get("session");
  const [data, setData] = useState<{
    authenticated: boolean;
    service?: {
      name: string;
      priceCents: number;
      priceFrom: boolean;
      slaLabel: string;
      includedScope: string[];
      excludedScope: string[];
      shortDescription: string;
    };
    problemText?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    void fetch(`/api/checkout/preview?session=${sessionId}`)
      .then((response) => response.json())
      .then(setData);
  }, [sessionId]);

  async function pay() {
    if (!sessionId) return;
    setPending(true);
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    const json = await response.json();
    if (!response.ok) {
      setError(json.error || "We couldn't start checkout. Please try again.");
      setPending(false);
      return;
    }
    window.location.href = json.url;
  }

  async function register(formData: FormData) {
    setPending(true);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
        intakeSessionId: sessionId,
      }),
    });
    const json = await response.json();
    if (!response.ok) {
      setError(json.error || "Could not create the account.");
      setPending(false);
      return;
    }
    await signIn("credentials", {
      email: String(formData.get("email")),
      password: String(formData.get("password")),
      redirect: false,
    });
    await pay();
  }

  if (!data?.service) return <p>Loading checkout…</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-navy">Pay & start resolution</h1>
      <Card className="mt-6 p-6">
        <p className="text-sm text-muted">Problem</p>
        <p className="text-navy">{data.problemText}</p>
        <p className="mt-4 text-sm text-muted">Recommended service</p>
        <p className="font-medium text-navy">{data.service.name}</p>
        <p className="text-2xl font-semibold">{formatUsd(data.service.priceCents, data.service.priceFrom)}</p>
        <p className="text-sm text-muted">Expected turnaround: {data.service.slaLabel}</p>
        <p className="mt-3 text-sm text-muted">{data.service.shortDescription}</p>
      </Card>
      {!data.authenticated ? (
        <form action={register} className="mt-6 space-y-3">
          <p className="text-sm text-muted">Create your account to start the case.</p>
          <Input name="name" placeholder="Name" required />
          <Input name="email" type="email" placeholder="Email" required />
          <Input name="password" type="password" minLength={8} placeholder="Password" required />
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <Button type="submit" disabled={pending} className="w-full">
            Pay {formatUsd(data.service.priceCents)} & Start Resolution
          </Button>
        </form>
      ) : (
        <div className="mt-6">
          {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}
          <Button onClick={() => void pay()} disabled={pending} className="w-full">
            Pay {formatUsd(data.service.priceCents)} & Start Resolution
          </Button>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutInner />
    </Suspense>
  );
}

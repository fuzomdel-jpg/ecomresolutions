"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

type Service = {
  id: string;
  name: string;
  shortDescription: string;
  description: string;
  priceCents: number;
  priceFrom: boolean;
  slaLabel: string;
  slaHours: number;
  complexity: string;
  isActive: boolean;
  isPopular: boolean;
  diagnosticEligible: boolean;
  diagnosticCreditEnabled: boolean;
  subscriptionEligible: boolean;
  includedScope: string[];
  excludedScope: string[];
  requiredInformation: string[];
  requiredAccess: string[];
  requiredAttachments: string[];
  seoTitle: string;
  seoDescription: string;
};

function Editor({ services }: { services: Service[] }) {
  const params = useSearchParams();
  const selected = services.find((item) => item.id === params.get("edit")) ?? services[0];
  const [form, setForm] = useState(selected);
  const jsonReady = useMemo(() => form, [form]);

  if (!form) return null;

  return (
    <form
      className="mt-8 grid gap-3 rounded-2xl border border-border bg-white p-5"
      onSubmit={async (event) => {
        event.preventDefault();
        await fetch(`/api/admin/services/${form.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...jsonReady,
            priceCents: Number(form.priceCents),
            slaHours: Number(form.slaHours),
          }),
        });
        window.location.reload();
      }}
    >
      <h2 className="font-semibold">Edit service</h2>
      <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
      <Input
        value={form.shortDescription}
        onChange={(event) => setForm({ ...form, shortDescription: event.target.value })}
      />
      <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
      <label className="text-sm">
        Price (cents)
        <Input
          type="number"
          value={form.priceCents}
          onChange={(event) => setForm({ ...form, priceCents: Number(event.target.value) })}
        />
      </label>
      <label className="text-sm">
        SLA label
        <Input value={form.slaLabel} onChange={(event) => setForm({ ...form, slaLabel: event.target.value })} />
      </label>
      <label className="text-sm">
        SLA hours
        <Input
          type="number"
          value={form.slaHours}
          onChange={(event) => setForm({ ...form, slaHours: Number(event.target.value) })}
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
        />
        Active
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.diagnosticEligible}
          onChange={(event) => setForm({ ...form, diagnosticEligible: event.target.checked })}
        />
        Diagnostic eligible
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.diagnosticCreditEnabled}
          onChange={(event) => setForm({ ...form, diagnosticCreditEnabled: event.target.checked })}
        />
        Diagnostic credit enabled
      </label>
      <Button type="submit">Save</Button>
    </form>
  );
}

export function AdminServiceEditor({ services }: { services: Service[] }) {
  return (
    <Suspense>
      <Editor services={services} />
    </Suspense>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LeadSettingsForm({
  batchSizePerMarket,
  maxCompaniesPerRun,
  maxContactsPerCompany,
  additionalCountries,
  usEnabled,
  dubaiEnabled,
}: {
  batchSizePerMarket: number;
  maxCompaniesPerRun: number;
  maxContactsPerCompany: number;
  additionalCountries: string[];
  usEnabled: boolean;
  dubaiEnabled: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setMessage("");
    const response = await fetch("/api/admin/leads/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        batchSizePerMarket: Number(formData.get("batchSizePerMarket")),
        maxCompaniesPerRun: Number(formData.get("maxCompaniesPerRun")),
        maxContactsPerCompany: Number(formData.get("maxContactsPerCompany")),
        additionalCountries: String(formData.get("additionalCountries") ?? ""),
        usEnabled: formData.get("usEnabled") === "on",
        dubaiEnabled: formData.get("dubaiEnabled") === "on",
      }),
    });
    setPending(false);
    if (!response.ok) {
      setMessage("Settings could not be saved.");
      return;
    }
    setMessage("Research limits saved.");
    router.refresh();
  }

  return (
    <form action={onSubmit} className="grid gap-3 md:grid-cols-2">
      <label className="text-sm">
        Batch size per market
        <Input name="batchSizePerMarket" type="number" min={1} max={500} defaultValue={batchSizePerMarket} className="mt-1" />
      </label>
      <label className="text-sm">
        Total companies per run
        <Input name="maxCompaniesPerRun" type="number" min={1} max={5000} defaultValue={maxCompaniesPerRun} className="mt-1" />
      </label>
      <label className="text-sm">
        Decision-makers per company
        <Input name="maxContactsPerCompany" type="number" min={1} max={10} defaultValue={maxContactsPerCompany} className="mt-1" />
      </label>
      <label className="text-sm">
        Additional countries, explicitly enabled
        <Input name="additionalCountries" defaultValue={additionalCountries.join(", ")} placeholder="Leave blank. India is off." className="mt-1" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input name="usEnabled" type="checkbox" defaultChecked={usEnabled} />
        United States research
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input name="dubaiEnabled" type="checkbox" defaultChecked={dubaiEnabled} />
        Dubai research
      </label>
      <div className="md:col-span-2 flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          Save research limits
        </Button>
        {message ? <p className="text-sm text-muted">{message}</p> : null}
      </div>
    </form>
  );
}

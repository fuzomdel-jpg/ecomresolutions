"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

const fields = [
  ["name", "Company"],
  ["website", "Website"],
  ["headquartersCountry", "Headquarters country"],
  ["headquartersRegion", "Emirate or US state"],
  ["headquartersCity", "City"],
  ["locationSourceUrl", "Location source URL"],
  ["operatingCountry", "Operating country"],
  ["operatingRegion", "Operating emirate or state"],
  ["operatingCity", "Operating city"],
  ["marketplace", "Target marketplace"],
  ["shipsTo", "Ships to (comma separated)"],
  ["contactName", "Decision-maker name"],
  ["contactTitle", "Decision-maker title"],
  ["profileUrl", "Public profile URL"],
  ["email", "Public business email"],
  ["sourceUrl", "Source URL"],
] as const;

export function LeadIntakeForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    const payload = Object.fromEntries(formData.entries());
    payload.substantialEcommerce = formData.get("substantialEcommerce") === "on" ? "true" : "false";
    const response = await fetch("/api/admin/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json()) as { id?: string; error?: string };
    setPending(false);
    if (!response.ok || !body.id) {
      setError(body.error ?? "This company could not be added.");
      return;
    }
    router.push(`/admin/leads/${body.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
      {fields.map(([name, label]) => (
        <label key={name} className="text-sm">
          {label}
          <Input name={name} className="mt-1" />
        </label>
      ))}
      <label className="text-sm">
        Contact verification
        <select name="contactVerification" className="mt-1 h-10 w-full rounded-xl border border-border bg-white px-3 text-sm" defaultValue="UNVERIFIED">
          <option value="UNVERIFIED">Unverified</option>
          <option value="PUBLIC_LISTING">Public listing</option>
          <option value="VERIFIED">Verified</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input name="substantialEcommerce" type="checkbox" />
        Substantial ecommerce operation at the operating location
      </label>
      <label className="text-sm md:col-span-2">
        Location evidence
        <Textarea name="locationEvidence" className="mt-1" rows={3} />
      </label>
      <label className="text-sm md:col-span-2">
        Marketplace evidence
        <Textarea name="marketplaceEvidence" className="mt-1" rows={3} />
      </label>
      <label className="text-sm md:col-span-2">
        Evidence-backed opportunity
        <Textarea name="opportunity" className="mt-1" rows={4} />
      </label>
      {error ? <p className="text-sm text-red-700 md:col-span-2">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        Add company
      </Button>
    </form>
  );
}

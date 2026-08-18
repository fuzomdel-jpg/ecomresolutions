"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DiagnosticCreditForm({ enabled, message }: { enabled: boolean; message: string }) {
  const [on, setOn] = useState(enabled);
  const [copy, setCopy] = useState(message);
  return (
    <form
      className="mt-3 space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        await fetch("/api/admin/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: "diagnosticCreditPolicy",
            value: { enabled: on, message: copy },
          }),
        });
      }}
    >
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={on} onChange={(event) => setOn(event.target.checked)} />
        Enable diagnostic credit toward recommended resolution
      </label>
      <Input value={copy} onChange={(event) => setCopy(event.target.value)} />
      <Button type="submit">Save</Button>
    </form>
  );
}

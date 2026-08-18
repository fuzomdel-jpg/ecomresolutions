import { env } from "@/lib/env";
import { createHmac, timingSafeEqual } from "node:crypto";

export async function emitAutomationEvent(event: string, payload: unknown) {
  if (!env.N8N_OUTBOUND_WEBHOOK_URL) return;
  const body = JSON.stringify({ event, payload, emittedAt: new Date().toISOString() });
  const signature = env.N8N_WEBHOOK_SECRET
    ? createHmac("sha256", env.N8N_WEBHOOK_SECRET).update(body).digest("hex")
    : "";
  await fetch(env.N8N_OUTBOUND_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(signature ? { "x-ecom-signature": signature } : {}),
    },
    body,
  }).catch((error) => console.error("n8n_outbound_failed", error));
}

export function verifyN8nSignature(rawBody: string, signature: string | null) {
  if (!env.N8N_WEBHOOK_SECRET) return true;
  if (!signature) return false;
  const digest = createHmac("sha256", env.N8N_WEBHOOK_SECRET).update(rawBody).digest("hex");
  const left = Buffer.from(digest);
  const right = Buffer.from(signature);
  return left.length === right.length && timingSafeEqual(left, right);
}

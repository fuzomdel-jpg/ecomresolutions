import { env } from "@/lib/env";

export type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendEmail(payload: EmailPayload) {
  if (!env.EMAIL_PROVIDER_API_KEY) {
    console.info("[email:dev]", payload.to, payload.subject, payload.text);
    return { id: "dev-log" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.EMAIL_PROVIDER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM || "Ecom Resolutions <noreply@ecomresolutions.com>",
      to: [payload.to],
      subject: payload.subject,
      text: payload.text,
      html: payload.html ?? `<p>${payload.text.replace(/\n/g, "<br/>")}</p>`,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Email provider error: ${body}`);
  }
  return response.json();
}

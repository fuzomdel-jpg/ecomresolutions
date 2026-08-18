import { NextResponse } from "next/server";
import { verifyN8nSignature } from "@/lib/webhooks";

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-ecom-signature");
  if (!verifyN8nSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}

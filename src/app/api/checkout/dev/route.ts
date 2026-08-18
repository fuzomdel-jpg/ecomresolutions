import { NextResponse } from "next/server";
import { fulfillPayment } from "@/lib/checkout";
import { getSessionUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Development checkout is disabled." }, { status: 404 });
  }
  const user = await getSessionUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));
  const paymentId = new URL(request.url).searchParams.get("paymentId");
  if (!paymentId) return NextResponse.json({ error: "Missing payment." }, { status: 400 });
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  try {
    const created = await fulfillPayment(paymentId);
    return NextResponse.redirect(new URL(`/app/cases/${created.id}`, request.url));
  } catch {
    return NextResponse.redirect(new URL(`/app/checkout/success?paymentId=${paymentId}`, request.url));
  }
}

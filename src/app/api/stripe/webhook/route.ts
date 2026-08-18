import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import { fulfillPayment } from "@/lib/checkout";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 501 });
  }
  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const paymentId = session.metadata?.paymentId;
    if (paymentId) {
      const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
      if (payment && !payment.caseId) {
        try {
          await fulfillPayment(paymentId, typeof session.payment_intent === "string" ? session.payment_intent : undefined);
        } catch (error) {
          console.error("case_creation_after_payment_failed", error);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}

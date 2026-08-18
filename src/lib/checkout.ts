import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { appUrl } from "@/lib/env";
import { createCaseFromPayment } from "@/lib/cases";
import { notifyUser } from "@/lib/notifications";
import { trackEvent } from "@/lib/analytics";
import { writeAudit } from "@/lib/audit";

export async function startCheckout(input: {
  intakeSessionId: string;
  userId: string;
  organizationId: string;
  email: string;
}) {
  const session = await prisma.intakeSession.findUnique({
    where: { id: input.intakeSessionId },
    include: { recommendedService: { include: { platform: true } } },
  });
  if (!session?.recommendedService) {
    throw new Error("We still need a recommended resolution before checkout.");
  }
  const service = session.recommendedService;
  const payment = await prisma.payment.create({
    data: {
      amountCents: service.priceCents,
      currency: "usd",
      status: PaymentStatus.PENDING,
      organizationId: input.organizationId,
      serviceId: service.id,
      intakeSessionId: session.id,
    },
  });

  await trackEvent("checkout_started", { paymentId: payment.id, serviceId: service.id }, { userId: input.userId });
  const stripe = getStripe();
  if (!stripe) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Payments are temporarily unavailable. Please try again shortly.");
    }
    return {
      mode: "dev" as const,
      paymentId: payment.id,
      url: `/api/checkout/dev?paymentId=${payment.id}`,
    };
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: input.email,
    client_reference_id: payment.id,
    metadata: {
      paymentId: payment.id,
      intakeSessionId: session.id,
      userId: input.userId,
      organizationId: input.organizationId,
      serviceId: service.id,
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: service.priceCents,
          product_data: {
            name: service.name,
            description: `${service.shortDescription} Typical turnaround: ${service.slaLabel}.`,
          },
        },
      },
    ],
    success_url: `${appUrl()}/app/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl()}/app/new?session=${session.id}`,
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: { stripeCheckoutSessionId: checkout.id, status: PaymentStatus.PROCESSING },
  });

  return { mode: "stripe" as const, paymentId: payment.id, url: checkout.url! };
}

export async function fulfillStripeSession(sessionId: string) {
  const payment = await prisma.payment.findUnique({
    where: { stripeCheckoutSessionId: sessionId },
    include: { intakeSession: true, service: true },
  });
  if (!payment) {
    throw new Error("We couldn't match that payment. If you were charged, we're creating your case now.");
  }
  return fulfillPayment(payment.id, payment.stripePaymentIntentId ?? undefined);
}

export async function fulfillPayment(paymentId: string, stripePaymentIntentId?: string) {
  const payment = await prisma.payment.findUniqueOrThrow({
    where: { id: paymentId },
    include: { intakeSession: true },
  });

  if (payment.caseId) {
    return prisma.case.findUniqueOrThrow({ where: { id: payment.caseId } });
  }

  const intake = payment.intakeSession;
  if (!intake?.userId || !intake.organizationId || !payment.serviceId || !payment.organizationId) {
    if (!intake) throw new Error("Your payment was received. We're creating your case now.");
    throw new Error("Your payment was received. We're creating your case now.");
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.SUCCEEDED,
      stripePaymentIntentId: stripePaymentIntentId ?? payment.stripePaymentIntentId,
    },
  });

  const created = await createCaseFromPayment({
    organizationId: payment.organizationId,
    customerId: intake.userId,
    serviceId: payment.serviceId,
    intakeSessionId: intake.id,
    paymentId: payment.id,
    actorId: intake.userId,
  });

  await notifyUser({
    userId: intake.userId,
    type: "payment_success",
    title: "Payment received",
    body: "Your resolution has started.",
    link: `/app/cases/${created.id}`,
    caseId: created.id,
  });
  await trackEvent("payment_success", { paymentId: payment.id, caseId: created.id });
  await writeAudit({
    actorId: intake.userId,
    action: "payment.succeeded",
    entityType: "Payment",
    entityId: payment.id,
  });
  return created;
}

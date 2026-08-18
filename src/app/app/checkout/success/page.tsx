import { redirect } from "next/navigation";
import { fulfillPayment, fulfillStripeSession } from "@/lib/checkout";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; paymentId?: string }>;
}) {
  const params = await searchParams;
  let record = null;
  let failed = false;
  try {
    record = params.session_id
      ? await fulfillStripeSession(params.session_id)
      : params.paymentId
        ? await fulfillPayment(params.paymentId)
        : null;
  } catch {
    failed = true;
  }

  if (record) {
    redirect(`/app/cases/${record.id}`);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-navy">We&apos;re finishing your case</h1>
      <p className="mt-2 text-sm text-muted">
        {failed
          ? "Your payment was received. We're creating your case now. Refresh this page in a moment."
          : "Your payment was received. We're creating your case now."}
      </p>
    </div>
  );
}

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { formatUsd } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/app/billing");
  const payments = await prisma.payment.findMany({
    where: { organization: { members: { some: { userId: user.id } } } },
    include: { service: true, case: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy">Billing</h1>
      <div className="mt-6 space-y-3">
        {payments.length === 0 ? (
          <p className="text-sm text-muted">No payments yet.</p>
        ) : (
          payments.map((payment) => (
            <Card key={payment.id} className="p-4 text-sm">
              <p className="font-medium">{payment.service?.name ?? "Resolution"}</p>
              <p>
                {formatUsd(payment.amountCents)} · {payment.status} · {payment.case?.caseNumber ?? "Pending case"}
              </p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

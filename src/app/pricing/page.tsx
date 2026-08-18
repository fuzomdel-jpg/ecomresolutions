import { PublicShell } from "@/components/layout/public-shell";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { formatUsd } from "@/lib/utils";
import { getDiagnosticCreditMessage } from "@/lib/catalog";
import { ProblemComposer } from "@/components/composer/problem-composer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pricing" };

export default async function PricingPage() {
  const [tiers, credit] = await Promise.all([
    prisma.pricingTier.findMany({ orderBy: { sortOrder: "asc" } }),
    getDiagnosticCreditMessage(),
  ]);
  return (
    <PublicShell>
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-3xl font-semibold text-navy">Fixed pricing</h1>
        <p className="mt-2 text-muted">Clear upfront pricing. No hidden fees. Marketplace outcomes remain with the platform.</p>
        {credit ? <p className="mt-4 text-sm text-navy">{credit}</p> : null}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {tiers.map((tier) => (
            <Card key={tier.id} className="p-6">
              <p className="font-semibold text-navy">{tier.name}</p>
              <p className="mt-2 text-3xl font-semibold">{formatUsd(tier.priceCents, tier.priceFrom)}</p>
              <p className="mt-2 text-sm text-muted">{tier.description}</p>
            </Card>
          ))}
        </div>
        <div className="mt-12">
          <ProblemComposer heading="Not sure which tier? Describe the issue." />
        </div>
      </div>
    </PublicShell>
  );
}

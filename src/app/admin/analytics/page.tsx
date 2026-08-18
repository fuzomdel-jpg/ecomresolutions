import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { formatUsd } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [payments, resolved, events] = await Promise.all([
    prisma.payment.findMany({ where: { status: "SUCCEEDED" }, include: { service: { include: { platform: true } } } }),
    prisma.case.findMany({ where: { status: { in: ["RESOLVED", "CLOSED"] } } }),
    prisma.analyticsEvent.groupBy({ by: ["name"], _count: true }),
  ]);
  const revenue = payments.reduce((sum, payment) => sum + payment.amountCents, 0);
  const byPlatform = new Map<string, number>();
  for (const payment of payments) {
    const platform = payment.service?.platform.name ?? "Unknown";
    byPlatform.set(platform, (byPlatform.get(platform) ?? 0) + payment.amountCents);
  }
  return (
    <div>
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted">Revenue</p>
          <p className="text-2xl font-semibold">{formatUsd(revenue)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted">Resolved cases</p>
          <p className="text-2xl font-semibold">{resolved.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted">Successful payments</p>
          <p className="text-2xl font-semibold">{payments.length}</p>
        </Card>
      </div>
      <h2 className="mt-8 font-semibold">Revenue by platform</h2>
      <ul className="mt-2 text-sm">
        {[...byPlatform.entries()].map(([name, cents]) => (
          <li key={name}>
            {name}: {formatUsd(cents)}
          </li>
        ))}
      </ul>
      <h2 className="mt-8 font-semibold">Events</h2>
      <ul className="mt-2 text-sm">
        {events.map((event) => (
          <li key={event.name}>
            {event.name}: {event._count}
          </li>
        ))}
      </ul>
    </div>
  );
}

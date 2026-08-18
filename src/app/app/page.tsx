import Link from "next/link";
import { redirect } from "next/navigation";
import { ProblemComposer } from "@/components/composer/problem-composer";
import { StatusBadge } from "@/components/cases/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { slaRemaining } from "@/lib/cases";

export const dynamic = "force-dynamic";

export default async function CustomerHome() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/app");
  const cases = await prisma.case.findMany({
    where: { organization: { members: { some: { userId: user.id } } } },
    include: { platform: true, assignedAgent: true },
    orderBy: { updatedAt: "desc" },
  });
  const active = cases.filter((item) => !["RESOLVED", "CLOSED", "CANCELLED"].includes(item.status));
  const waiting = active.filter((item) => item.status === "WAITING_FOR_CUSTOMER");
  const resolved = cases.filter((item) => item.status === "RESOLVED").slice(0, 8);
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy">What are we fixing today?</h1>
      <div className="mt-6">
        <ProblemComposer heading="Describe a new problem..." compact />
      </div>
      <div className="mt-8 grid gap-3 md:grid-cols-4">
        {[
          ["Active", String(active.length), "/app/cases"],
          ["Waiting for you", String(waiting.length), "/app/cases"],
          ["Resolved", String(resolved.length), "/app/cases"],
          ["Billing", "Invoices", "/app/billing"],
        ].map(([label, value, href]) => (
          <Link key={label} href={href}>
            <Card className="p-4">
              <p className="text-xs text-muted">{label}</p>
              <p className="mt-1 text-lg font-semibold text-navy">{value}</p>
            </Card>
          </Link>
        ))}
      </div>
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-navy">Active Cases</h2>
        <div className="mt-3 space-y-3">
          {active.length === 0 ? (
            <EmptyState title="Nothing here yet." body="Have an e-commerce problem? Tell us what happened." />
          ) : (
            active.map((item) => (
              <Link key={item.id} href={`/app/cases/${item.id}`}>
                <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm text-muted">{item.caseNumber} · {item.platform.name}</p>
                    <p className="font-medium text-navy">{item.title}</p>
                    <p className="text-xs text-muted">
                      {item.assignedAgent?.name ?? "Unassigned"} · {slaRemaining(item.slaDueAt)}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </Card>
              </Link>
            ))
          )}
        </div>
      </section>
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-navy">Recently Resolved</h2>
        <div className="mt-3 space-y-3">
          {resolved.length === 0 ? (
            <p className="text-sm text-muted">Resolved cases will appear here.</p>
          ) : (
            resolved.map((item) => (
              <Link key={item.id} href={`/app/cases/${item.id}`} className="block text-sm text-navy">
                {item.caseNumber} · {item.title}
              </Link>
            ))
          )}
        </div>
      </section>
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-navy">Recent activity</h2>
        {notifications.length === 0 ? (
          <p className="mt-2 text-sm text-muted">You&apos;re all caught up.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {notifications.map((item) => (
              <li key={item.id}>
                <Link href={item.link || "/app"}>{item.title}</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

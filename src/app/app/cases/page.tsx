import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/cases/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { slaRemaining } from "@/lib/cases";

export const dynamic = "force-dynamic";

export default async function CasesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/app/cases");
  const cases = await prisma.case.findMany({
    where: { organization: { members: { some: { userId: user.id } } } },
    include: { platform: true, assignedAgent: true },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy">My Cases</h1>
      <div className="mt-6 space-y-3">
        {cases.length === 0 ? (
          <EmptyState title="Nothing here yet." body="Have an e-commerce problem? Tell us what happened." />
        ) : (
          cases.map((item) => (
            <Link key={item.id} href={`/app/cases/${item.id}`}>
              <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm text-muted">
                    {item.caseNumber} · {item.platform.name}
                  </p>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted">
                    Updated {item.updatedAt.toLocaleString()} · {item.assignedAgent?.name ?? "Unassigned"} ·{" "}
                    {slaRemaining(item.slaDueAt)}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

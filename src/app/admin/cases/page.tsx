import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/cases/status-badge";
import { formatUsd } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminCasesPage() {
  const cases = await prisma.case.findMany({
    include: { customer: true, platform: true, service: true, assignedAgent: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div>
      <h1 className="text-2xl font-semibold">Cases</h1>
      <div className="mt-6 space-y-3">
        {cases.map((item) => (
          <Link key={item.id} href={`/admin/cases/${item.id}`}>
            <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm text-muted">
                  {item.caseNumber} · {item.customer.email} · {item.platform.name} · {formatUsd(item.priceCents)}
                </p>
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-muted">{item.assignedAgent?.name ?? "Unassigned"}</p>
              </div>
              <StatusBadge status={item.status} />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

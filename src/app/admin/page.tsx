import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/cases/status-badge";
import { CaseStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const counts = await Promise.all(
    (["NEW", "DIAGNOSING", "WAITING_FOR_CUSTOMER", "IN_PROGRESS", "QA"] as CaseStatus[]).map(async (status) => ({
      status,
      count: await prisma.case.count({ where: { status } }),
    })),
  );
  const overdue = await prisma.case.count({
    where: { slaDueAt: { lt: new Date() }, status: { notIn: ["RESOLVED", "CLOSED", "CANCELLED"] } },
  });
  const inbox = await prisma.case.findMany({
    where: { status: { in: ["NEW", "DIAGNOSING", "WAITING_FOR_CUSTOMER", "IN_PROGRESS", "QA"] } },
    include: { platform: true, customer: true, service: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy">Inbox</h1>
      <div className="mt-6 grid gap-3 md:grid-cols-6">
        {counts.map((item) => (
          <Card key={item.status} className="p-4">
            <p className="text-xs text-muted">{item.status.replaceAll("_", " ")}</p>
            <p className="text-2xl font-semibold">{item.count}</p>
          </Card>
        ))}
        <Card className="p-4">
          <p className="text-xs text-muted">Overdue</p>
          <p className="text-2xl font-semibold">{overdue}</p>
        </Card>
      </div>
      <div className="mt-8 space-y-3">
        {inbox.map((item) => (
          <Link key={item.id} href={`/admin/cases/${item.id}`} className="block">
            <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm text-muted">
                  {item.caseNumber} · {item.customer.email} · {item.platform.name}
                </p>
                <p className="font-medium">{item.title}</p>
              </div>
              <StatusBadge status={item.status} />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

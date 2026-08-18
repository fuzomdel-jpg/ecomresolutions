import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    include: { _count: { select: { customerCases: true } }, memberships: { include: { organization: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      <h1 className="text-2xl font-semibold">Customers</h1>
      <div className="mt-6 space-y-3">
        {customers.map((user) => (
          <Card key={user.id} className="p-4 text-sm">
            <p className="font-medium">{user.email}</p>
            <p className="text-muted">
              {user.memberships[0]?.organization.name ?? "No workspace"} · {user._count.customerCases} cases
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}

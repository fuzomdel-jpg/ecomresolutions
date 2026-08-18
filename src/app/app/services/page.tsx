import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { formatUsd } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AppServicesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/app/services");
  const services = await prisma.service.findMany({
    where: { isActive: true },
    include: { platform: true },
    orderBy: [{ platform: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });
  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy">Recommended services</h1>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {services.slice(0, 12).map((service) => (
          <Link key={service.id} href={`/app/services/${service.id}`}>
            <Card className="p-4">
              <p className="font-medium">{service.name}</p>
              <p className="text-sm text-muted">{formatUsd(service.priceCents, service.priceFrom)}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

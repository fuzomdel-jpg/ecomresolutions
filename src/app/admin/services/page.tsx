import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { formatUsd } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const services = await prisma.service.findMany({
    include: { platform: true },
    orderBy: [{ platform: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });
  return (
    <div>
      <h1 className="text-2xl font-semibold">Services</h1>
      <div className="mt-6 grid gap-3">
        {services.map((service) => (
          <Link key={service.id} href={`/admin/services?edit=${service.id}`}>
            <Card className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{service.name}</p>
                <p className="text-sm text-muted">
                  {service.platform.name} · {service.isActive ? "Active" : "Inactive"}
                </p>
              </div>
              <p>{formatUsd(service.priceCents, service.priceFrom)}</p>
            </Card>
          </Link>
        ))}
      </div>
      <ServiceEditor />
    </div>
  );
}

async function ServiceEditor() {
  const { AdminServiceEditor } = await import("@/components/admin/service-editor");
  const services = await prisma.service.findMany({ include: { platform: true } });
  return <AdminServiceEditor services={services} />;
}

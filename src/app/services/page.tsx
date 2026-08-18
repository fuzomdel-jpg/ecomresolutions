import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { formatUsd } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Services" };

export default async function ServicesPage() {
  const platforms = await prisma.platform.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { services: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
  });

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-semibold text-navy">Services</h1>
        <p className="mt-2 text-muted">Choose a resolution or describe the problem if you&apos;re not sure.</p>
        {platforms.map((platform) => (
          <section key={platform.id} className="mt-10">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-navy">{platform.name}</h2>
              <Link href={`/platforms/${platform.slug}`} className="text-sm text-accent">
                View platform
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {platform.services.map((service) => (
                <Card key={service.id} className="p-5">
                  <p className="font-medium text-navy">{service.name}</p>
                  <p className="mt-1 text-sm text-muted">{service.shortDescription}</p>
                  <p className="mt-3 text-sm text-navy">
                    {formatUsd(service.priceCents, service.priceFrom)} · {service.slaLabel}
                  </p>
                  <Button asChild size="sm" className="mt-4">
                    <Link href={`/services/${service.slug}`}>Fix This Problem</Link>
                  </Button>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PublicShell>
  );
}

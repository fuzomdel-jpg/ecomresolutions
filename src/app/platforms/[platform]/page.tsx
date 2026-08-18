import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/layout/public-shell";
import { ProblemComposer } from "@/components/composer/problem-composer";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { formatUsd } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export default async function PlatformPage({ params }: { params: Promise<{ platform: string }> }) {
  const { platform: slug } = await params;
  const platform = await prisma.platform.findUnique({
    where: { slug },
    include: { services: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
  });
  if (!platform) notFound();
  await trackEvent("platform_selected", { slug });

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-semibold text-navy">What are you trying to fix?</h1>
        <p className="mt-2 text-muted">{platform.name} problems, diagnosed and priced before you pay.</p>
        <div className="mt-8">
          <ProblemComposer platformSlug={platform.slug} />
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {platform.services.map((service) => (
            <Link key={service.id} href={`/services/${service.slug}`}>
              <Card className="p-5 hover:border-accent">
                <p className="font-medium text-navy">{service.name}</p>
                <p className="mt-1 text-sm text-muted">{service.shortDescription}</p>
                <p className="mt-3 text-sm">
                  {formatUsd(service.priceCents, service.priceFrom)} · {service.slaLabel}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}

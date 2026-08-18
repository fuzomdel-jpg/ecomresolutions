import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PublicShell } from "@/components/layout/public-shell";
import { ProblemComposer } from "@/components/composer/problem-composer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { formatUsd } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema, faqSchema } from "@/lib/seo/schema";
import { faqs as siteFaqs } from "@/lib/content/faqs";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = await prisma.service.findUnique({ where: { slug }, include: { platform: true } });
  if (!service) return { title: "Service" };
  return {
    title: service.seoTitle,
    description: service.seoDescription,
    keywords: [service.name, service.platform.name, `${service.platform.name} listing issue`],
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: {
      title: service.ogTitle ?? service.seoTitle,
      description: service.ogDescription ?? service.seoDescription,
    },
  };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await prisma.service.findUnique({
    where: { slug },
    include: { platform: true },
  });
  if (!service || !service.isActive) notFound();
  await trackEvent("service_viewed", { slug });

  return (
    <PublicShell>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: service.name, path: `/services/${service.slug}` },
        ])}
      />
      <JsonLd data={faqSchema(siteFaqs.slice(0, 6))} />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <Breadcrumbs
            items={[
              { name: "Home", href: "/" },
              { name: "Services", href: "/services" },
              { name: service.name, href: `/services/${service.slug}` },
            ]}
          />
          <p className="mt-4 text-sm text-accent">{service.platform.name}</p>
          <h1 className="mt-2 text-3xl font-semibold text-navy">{service.name.replace(" Fix", "")}?</h1>
          <p className="mt-3 text-muted">{service.description}</p>
          <div className="mt-8">
            <ProblemComposer serviceSlug={service.slug} platformSlug={service.platform.slug} />
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="font-semibold text-navy">Included</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                {service.includedScope.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-semibold text-navy">Not included</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                {service.excludedScope.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <Card className="h-fit p-6">
          <p className="text-sm text-muted">Recommended resolution</p>
          <p className="mt-1 text-2xl font-semibold text-navy">
            {formatUsd(service.priceCents, service.priceFrom)}
          </p>
          <p className="mt-1 text-sm text-muted">Typical turnaround: {service.slaLabel}</p>
          {service.diagnosticEligible ? (
            <p className="mt-3 text-sm text-navy">
              Your diagnostic fee can be credited toward the recommended resolution when that setting is enabled.
            </p>
          ) : null}
          <Button asChild className="mt-6 w-full">
            <Link href={`/app/new?service=${service.slug}`}>Fix This Problem — {formatUsd(service.priceCents, service.priceFrom)}</Link>
          </Button>
        </Card>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: service.name,
            description: service.seoDescription,
            provider: { "@type": "Organization", name: "Ecom Resolutions" },
            offers: {
              "@type": "Offer",
              priceCurrency: "USD",
              price: (service.priceCents / 100).toFixed(0),
            },
          }),
        }}
      />
    </PublicShell>
  );
}

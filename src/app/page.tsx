import Link from "next/link";
import { ArrowRight, Clock, Lock, Shield, Wallet } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { ProblemComposer } from "@/components/composer/problem-composer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDiagnosticCreditMessage, getNavData, getPopularServices } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { formatUsd } from "@/lib/utils";
import { faqs } from "@/lib/content/faqs";
import { trackEvent } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  await trackEvent("page_view", { path: "/" });
  const [platforms, popular, tiers, credit] = await Promise.all([
    getNavData(),
    getPopularServices(),
    prisma.pricingTier.findMany({ orderBy: { sortOrder: "asc" } }),
    getDiagnosticCreditMessage(),
  ]);

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 pb-20">
        <section className="pt-12 text-center md:pt-16">
          <p className="text-sm font-medium text-accent">E-commerce problems. Resolved.</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy md:text-5xl">
            What&apos;s wrong with your store?
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
            Describe the issue. We&apos;ll diagnose it, fix it, and get it resolved.
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted">
            Fixed-price expert resolution for Amazon, Walmart, Shopify, Google Merchant Center and TikTok Shop.
          </p>
          <div className="mt-8">
            <ProblemComposer initialValue={q} />
          </div>
        </section>

        <section className="mt-12">
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar md:grid md:grid-cols-5 md:overflow-visible">
            {platforms.map((platform) => (
              <Link
                key={platform.slug}
                href={`/platforms/${platform.slug}`}
                className="min-w-[160px] rounded-2xl border border-border bg-white px-4 py-4 text-left hover:border-accent"
              >
                <p className="text-sm font-semibold text-navy">{platform.name}</p>
                <p className="mt-1 text-xs text-muted">What are you trying to fix?</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-xl font-semibold text-navy">Popular resolutions</h2>
            <Link href="/services" className="text-sm font-medium text-accent">
              Browse Services
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {popular.map((service) => (
              <Link key={service.id} href={`/services/${service.slug}`} className="block">
                <Card className="flex items-center justify-between gap-4 p-5 hover:border-accent">
                  <div>
                    <p className="font-medium text-navy">{service.name}</p>
                    <p className="mt-1 text-sm text-muted">{service.shortDescription}</p>
                    <p className="mt-3 text-sm text-navy">
                      {formatUsd(service.priceCents, service.priceFrom)} · {service.slaLabel}
                    </p>
                  </div>
                  <span className="inline-flex items-center text-sm font-medium text-accent">
                    Fix This <ArrowRight className="ml-1 h-4 w-4" />
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-xl font-semibold text-navy">How it works</h2>
          <p className="mt-2 text-sm text-muted">No long discovery calls. No unnecessary retainers.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {[
              ["01", "Tell us what's wrong."],
              ["02", "We diagnose the issue."],
              ["03", "We fix and verify it."],
              ["04", "You receive the resolution report."],
            ].map(([step, copy]) => (
              <Card key={step} className="p-5">
                <p className="text-xs font-semibold text-accent">{step}</p>
                <p className="mt-2 font-medium text-navy">{copy}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-4 md:grid-cols-4">
          {[
            [Shield, "Expert Specialists", "Experienced e-commerce professionals."],
            [Wallet, "Fixed Pricing", "Clear upfront pricing. No hidden fees."],
            [Clock, "Fast Turnaround", "Most issues resolved within 24–48 hours."],
            [Lock, "Secure Access", "Your accounts remain yours. Access is controlled and scoped."],
          ].map(([Icon, title, copy]) => (
            <Card key={title as string} className="p-5">
              <Icon className="h-4 w-4 text-accent" />
              <p className="mt-3 font-medium text-navy">{title as string}</p>
              <p className="mt-1 text-sm text-muted">{copy as string}</p>
            </Card>
          ))}
        </section>

        <section className="mt-16">
          <h2 className="text-xl font-semibold text-navy">Pricing philosophy</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Pay for a defined resolution, not a retainer. Diagnostics are available when you don&apos;t yet know what is
            wrong.
          </p>
          {credit ? <p className="mt-2 text-sm text-navy">{credit}</p> : null}
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {tiers.map((tier) => (
              <Card key={tier.id} className={`p-5 ${tier.isMostPopular ? "border-accent" : ""}`}>
                {tier.isMostPopular ? <p className="text-xs font-medium text-accent">Most popular</p> : null}
                <p className="mt-1 font-semibold text-navy">{tier.name}</p>
                <p className="mt-2 text-2xl font-semibold text-navy">{formatUsd(tier.priceCents, tier.priceFrom)}</p>
                <p className="mt-2 text-sm text-muted">{tier.description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-xl font-semibold text-navy">FAQ</h2>
          <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-white">
            {faqs.map((item) => (
              <details key={item.q} className="px-5 py-4">
                <summary className="cursor-pointer font-medium text-navy">{item.q}</summary>
                <p className="mt-2 text-sm text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-[32px] border border-border bg-white px-4 py-10">
          <h2 className="text-center text-2xl font-semibold text-navy">Still stuck?</h2>
          <p className="mt-2 text-center text-muted">Tell us what happened. We&apos;ll diagnose it.</p>
          <div className="mt-6">
            <ProblemComposer />
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild>
              <Link href="/app/new">Fix a Problem</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/services">Browse Services</Link>
            </Button>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PublicShell } from "@/components/layout/public-shell";
import { ProblemComposer } from "@/components/composer/problem-composer";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { formatUsd } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await prisma.problemPage.findUnique({ where: { slug } });
  if (!page) return { title: "Problem" };
  return {
    title: page.seoTitle,
    description: page.seoDescription,
    alternates: { canonical: `/problems/${page.slug}` },
  };
}

export default async function ProblemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await prisma.problemPage.findUnique({
    where: { slug },
    include: { service: true, platform: true },
  });
  if (!page) notFound();
  const faqs = (page.faqs as { q: string; a: string }[]) ?? [];
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-sm text-accent">{page.platform.name}</p>
        <h1 className="mt-2 text-3xl font-semibold text-navy">{page.h1}</h1>
        <p className="mt-3 text-muted">{page.problem}</p>
        <h2 className="mt-8 font-semibold text-navy">Common causes</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-muted">
          {page.commonCauses.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <h2 className="mt-8 font-semibold text-navy">What we check</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-muted">
          {page.whatWeCheck.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <h2 className="mt-8 font-semibold text-navy">What we can fix</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-muted">
          {page.whatWeCanFix.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-8 text-lg font-semibold text-navy">
          {formatUsd(page.service.priceCents, page.service.priceFrom)} · {page.service.slaLabel}
        </p>
        <Button asChild className="mt-4">
          <Link href={`/services/${page.service.slug}`}>
            Fix This Problem — {formatUsd(page.service.priceCents, page.service.priceFrom)}
          </Link>
        </Button>
        <div className="mt-10">
          {faqs.map((item) => (
            <details key={item.q} className="border-t border-border py-3">
              <summary className="cursor-pointer font-medium text-navy">{item.q}</summary>
              <p className="mt-2 text-sm text-muted">{item.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-10">
          <ProblemComposer platformSlug={page.platform.slug} serviceSlug={page.service.slug} />
        </div>
      </div>
    </PublicShell>
  );
}

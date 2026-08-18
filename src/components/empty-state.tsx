import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  body,
  ctaHref = "/app/new",
  cta = "Fix a Problem",
}: {
  title: string;
  body: string;
  ctaHref?: string;
  cta?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-12 text-center">
      <h2 className="text-lg font-semibold text-navy">{title}</h2>
      <p className="mt-2 text-sm text-muted">{body}</p>
      <Button asChild className="mt-5">
        <Link href={ctaHref}>{cta}</Link>
      </Button>
    </div>
  );
}

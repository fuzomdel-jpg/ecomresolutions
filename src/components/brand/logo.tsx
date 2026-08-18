import Link from "next/link";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/brand/logo-mark";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5 text-navy", className)} aria-label="Ecom Resolutions">
      <LogoMark className="h-9 w-10 shrink-0" />
      {!compact ? (
        <span className="leading-tight">
          <span className="block text-[15px] font-bold tracking-tight">
            <span className="text-navy">Ecom</span>
            <span className="text-accent">Resolutions</span>
          </span>
          <span className="mt-0.5 block text-[9px] font-medium uppercase tracking-[0.16em] text-navy">
            E-commerce problems. Resolved.
          </span>
        </span>
      ) : null}
    </Link>
  );
}

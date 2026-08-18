import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 text-navy", className)} aria-label="Ecom Resolutions">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy text-sm font-semibold text-white">
        ER
      </span>
      {!compact ? (
        <span className="leading-tight">
          <span className="block text-sm font-semibold tracking-tight">Ecom Resolutions</span>
          <span className="block text-[11px] text-muted">E-commerce problems. Resolved.</span>
        </span>
      ) : null}
    </Link>
  );
}

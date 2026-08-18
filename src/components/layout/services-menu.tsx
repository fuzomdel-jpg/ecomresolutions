"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatUsd } from "@/lib/utils";

type Platform = {
  slug: string;
  name: string;
  services: { slug: string; name: string; priceCents: number; priceFrom: boolean }[];
};

export function ServicesMenu({ platforms }: { platforms: Platform[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        className="inline-flex items-center gap-1 text-sm text-navy hover:text-accent"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        Services <ChevronDown className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute left-1/2 z-50 mt-3 w-[720px] -translate-x-1/2 rounded-2xl border border-border bg-white p-4 shadow-xl">
          <div className="grid grid-cols-3 gap-4">
            {platforms.map((platform) => (
              <div key={platform.slug}>
                <Link href={`/platforms/${platform.slug}`} className="text-sm font-semibold text-navy">
                  {platform.name}
                </Link>
                <ul className="mt-2 space-y-1">
                  {platform.services.slice(0, 4).map((service) => (
                    <li key={service.slug}>
                      <Link href={`/services/${service.slug}`} className="text-sm text-muted hover:text-navy">
                        {service.name}
                        <span className="ml-1 text-xs">{formatUsd(service.priceCents, service.priceFrom)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-border pt-3">
            <Link href="/services" className="text-sm font-medium text-accent">
              View all services →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

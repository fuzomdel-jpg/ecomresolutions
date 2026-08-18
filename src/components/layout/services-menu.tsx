"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatUsd } from "@/lib/utils";

type Platform = {
  slug: string;
  name: string;
  services: { slug: string; name: string; priceCents: number; priceFrom: boolean }[];
};

export function ServicesMenu({ platforms }: { platforms: Platform[] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const menuId = useId();

  function clearCloseTimer() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function openMenu() {
    clearCloseTimer();
    setOpen(true);
  }

  function closeMenu() {
    clearCloseTimer();
    setOpen(false);
  }

  function scheduleClose() {
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => setOpen(false), 180);
  }

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className="inline-flex items-center gap-1 text-sm text-navy hover:text-accent"
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="true"
        onClick={() => (open ? closeMenu() : openMenu())}
        onFocus={openMenu}
      >
        Services <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute left-1/2 top-full z-[80] w-[min(46rem,calc(100vw-2rem))] -translate-x-1/2 pt-3"
        >
          <div className="rounded-2xl border border-border bg-white p-4 shadow-xl">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {platforms.map((platform) => (
                <div key={platform.slug}>
                  <Link
                    href={`/platforms/${platform.slug}`}
                    className="text-sm font-semibold text-navy hover:text-accent"
                    onClick={closeMenu}
                  >
                    {platform.name}
                  </Link>
                  <ul className="mt-2 space-y-1">
                    {platform.services.slice(0, 4).map((service) => (
                      <li key={service.slug}>
                        <Link
                          href={`/services/${service.slug}`}
                          className="block text-sm text-muted hover:text-navy"
                          onClick={closeMenu}
                        >
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
              <Link href="/services" className="text-sm font-medium text-accent" onClick={closeMenu}>
                View all services →
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

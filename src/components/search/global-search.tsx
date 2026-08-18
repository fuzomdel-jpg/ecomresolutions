"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { formatUsd } from "@/lib/utils";

type Result = {
  slug: string;
  name: string;
  shortDescription: string;
  priceCents: number;
  priceFrom: boolean;
  slaLabel: string;
  platformName: string;
};

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = (await response.json()) as { results: Result[] };
      setResults(data.results);
      setOpen(true);
    }, 180);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const empty = useMemo(() => query.trim().length > 1 && results.length === 0, [query, results.length]);

  return (
    <div ref={box} className="relative w-full max-w-md">
      <label className="sr-only" htmlFor="global-search">
        Search an e-commerce problem
      </label>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        id="global-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => query && setOpen(true)}
        placeholder="Search an e-commerce problem..."
        className="h-10 w-full rounded-full border border-border bg-white pl-9 pr-3 text-sm text-navy placeholder:text-muted"
      />
      {open ? (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-white shadow-lg">
          {results.map((result) => (
            <Link
              key={result.slug}
              href={`/services/${result.slug}`}
              className="block px-4 py-3 hover:bg-accent-soft"
              onClick={() => setOpen(false)}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-navy">{result.name}</p>
                <p className="text-sm text-navy">{formatUsd(result.priceCents, result.priceFrom)}</p>
              </div>
              <p className="text-xs text-muted">
                {result.platformName} · {result.slaLabel}
              </p>
            </Link>
          ))}
          {empty ? (
            <div className="px-4 py-4">
              <p className="text-sm font-medium text-navy">Couldn&apos;t find an exact match.</p>
              <p className="mt-1 text-sm text-muted">Describe your problem instead and we&apos;ll diagnose it.</p>
              <button
                type="button"
                className="mt-3 text-sm font-medium text-accent"
                onClick={() => {
                  setOpen(false);
                  router.push(`/?q=${encodeURIComponent(query)}`);
                }}
              >
                Describe this problem
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

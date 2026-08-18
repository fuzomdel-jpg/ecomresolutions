import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-muted md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} Ecom Resolutions. E-commerce problems. Resolved.</p>
        <div className="flex flex-wrap gap-4">
          <Link href="/security">Security</Link>
          <Link href="/how-it-works">How it works</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/resources">Resources</Link>
          <Link href="/services">Services</Link>
        </div>
      </div>
    </footer>
  );
}

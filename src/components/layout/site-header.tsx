import Link from "next/link";
import { Bell } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/components/search/global-search";
import { ServicesMenu } from "@/components/layout/services-menu";
import { UserMenu } from "@/components/layout/user-menu";
import { formatUsd } from "@/lib/utils";
import { getSessionUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { isStaff } from "@/lib/rbac";

export async function SiteHeader({ platforms }: { platforms: Awaited<ReturnType<typeof import("@/lib/catalog").getNavData>> }) {
  const user = await getSessionUser();
  const unread = user
    ? await prisma.notification.count({ where: { userId: user.id, readAt: null } })
    : 0;

  return (
    <header className="sticky top-0 z-50 overflow-visible border-b border-border bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 overflow-visible px-4">
        <Logo />
        <nav className="relative hidden flex-1 items-center justify-center gap-6 overflow-visible md:flex">
          <ServicesMenu platforms={platforms} />
          <Link className="text-sm text-navy hover:text-accent" href="/how-it-works">
            How It Works
          </Link>
          <Link className="text-sm text-navy hover:text-accent" href="/pricing">
            Pricing
          </Link>
          <Link className="text-sm text-navy hover:text-accent" href="/resources">
            Resources
          </Link>
          {user ? (
            <Link className="text-sm text-navy hover:text-accent" href="/app/cases">
              My Cases
            </Link>
          ) : null}
        </nav>
        <div className="ml-auto hidden md:block">
          <GlobalSearch />
        </div>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {user ? (
            <>
              <Button asChild size="sm">
                <Link href="/app/new">New Resolution</Link>
              </Button>
              <Link
                href="/app/account"
                className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-accent-soft"
                aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
              >
                <Bell className="h-4 w-4" />
                {unread ? (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" />
                ) : null}
              </Link>
              <UserMenu
                name={user.name}
                email={user.email}
                role={user.role}
                staff={isStaff(user.role)}
              />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="border-t border-border px-4 py-2 md:hidden">
        <GlobalSearch />
        <div className="mt-2 flex gap-4 overflow-x-auto text-sm no-scrollbar">
          <Link href="/services">Services</Link>
          <Link href="/how-it-works">How It Works</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/app/cases">My Cases</Link>
        </div>
      </div>
    </header>
  );
}

export function PriceLabel({ cents, from }: { cents: number; from?: boolean }) {
  return <span>{formatUsd(cents, from)}</span>;
}

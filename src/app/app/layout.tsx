import Link from "next/link";
import { Home, FolderOpen, Plus, Settings } from "lucide-react";
import { getSessionUser } from "@/lib/auth-helpers";
import { Logo } from "@/components/brand/logo";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  return (
    <div className="flex min-h-full flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Logo compact />
          <nav className="hidden items-center gap-4 text-sm md:flex">
            <Link href="/app">Home</Link>
            <Link href="/app/cases">My Cases</Link>
            <Link href="/app/new">New Resolution</Link>
            <Link href="/app/account">Account</Link>
          </nav>
          <p className="text-sm text-muted">{user?.email ?? "Guest"}</p>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 md:pb-6">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-white py-2 text-xs md:hidden">
        <Link href="/app" className="flex flex-col items-center gap-1">
          <Home className="h-4 w-4" /> Home
        </Link>
        <Link href="/app/cases" className="flex flex-col items-center gap-1">
          <FolderOpen className="h-4 w-4" /> Cases
        </Link>
        <Link href="/app/new" className="flex flex-col items-center gap-1">
          <Plus className="h-4 w-4" /> New
        </Link>
        <Link href="/app/settings" className="flex flex-col items-center gap-1">
          <Settings className="h-4 w-4" /> Settings
        </Link>
      </nav>
    </div>
  );
}

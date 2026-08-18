import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-helpers";
import { isStaff } from "@/lib/rbac";

const items = [
  ["Inbox", "/admin"],
  ["Cases", "/admin/cases"],
  ["Customers", "/admin/customers"],
  ["Services", "/admin/services"],
  ["Platforms", "/admin/platforms"],
  ["Knowledge", "/admin/knowledge"],
  ["Team", "/admin/team"],
  ["Analytics", "/admin/analytics"],
  ["Settings", "/admin/settings"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user || !isStaff(user.role)) redirect("/login?next=/admin");
  return (
    <div className="flex min-h-full">
      <aside className="hidden w-56 border-r border-border bg-white p-4 md:block">
        <p className="text-sm font-semibold text-navy">Ecom Resolutions</p>
        <p className="text-xs text-muted">Specialist console</p>
        <nav className="mt-6 space-y-1 text-sm">
          {items.map(([label, href]) => (
            <Link key={href} href={href} className="block rounded-lg px-3 py-2 hover:bg-accent-soft">
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1">
        <div className="flex gap-3 overflow-x-auto border-b border-border bg-white px-4 py-3 text-sm md:hidden no-scrollbar">
          {items.map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

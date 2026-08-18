import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getNavData } from "@/lib/catalog";

export async function PublicShell({ children }: { children: React.ReactNode }) {
  const platforms = await getNavData();
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader platforms={platforms} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

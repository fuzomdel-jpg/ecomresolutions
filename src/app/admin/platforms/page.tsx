import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function PlatformsPage() {
  const platforms = await prisma.platform.findMany({ include: { _count: { select: { services: true } } }, orderBy: { sortOrder: "asc" } });
  return (
    <div>
      <h1 className="text-2xl font-semibold">Platforms</h1>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {platforms.map((platform) => (
          <Card key={platform.id} className="p-4">
            <p className="font-medium">{platform.name}</p>
            <p className="text-sm text-muted">
              {platform.slug} · {platform._count.services} services · {platform.isActive ? "Active" : "Inactive"}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}

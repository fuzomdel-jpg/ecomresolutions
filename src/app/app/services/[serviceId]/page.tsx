import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AppServicePage({ params }: { params: Promise<{ serviceId: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { serviceId } = await params;
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) notFound();
  return (
    <div>
      <h1 className="text-2xl font-semibold">{service.name}</h1>
      <p className="mt-2 text-muted">{service.shortDescription}</p>
      <p className="mt-4 text-lg font-semibold">{formatUsd(service.priceCents, service.priceFrom)}</p>
      <Button asChild className="mt-4">
        <Link href={`/app/new?service=${service.slug}`}>Fix This Problem</Link>
      </Button>
    </div>
  );
}

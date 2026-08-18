import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { searchServices } from "@/lib/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const services = await prisma.service.findMany({
    where: { isActive: true },
    include: { platform: true },
  });
  const results = searchServices(
    q,
    services.map((service) => ({
      id: service.id,
      slug: service.slug,
      name: service.name,
      shortDescription: service.shortDescription,
      priceCents: service.priceCents,
      priceFrom: service.priceFrom,
      slaLabel: service.slaLabel,
      platformName: service.platform.name,
      platformSlug: service.platform.slug,
    })),
  );
  return NextResponse.json({ results });
}

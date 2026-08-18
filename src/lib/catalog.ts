import { prisma } from "@/lib/db";

export async function getNavData() {
  const platforms = await prisma.platform.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      services: {
        where: { isActive: true },
        orderBy: [{ isPopular: "desc" }, { sortOrder: "asc" }],
        take: 6,
        select: { slug: true, name: true, priceCents: true, priceFrom: true },
      },
    },
  });
  return platforms;
}

export async function getPopularServices() {
  return prisma.service.findMany({
    where: { isActive: true, isPopular: true },
    include: { platform: true },
    orderBy: [{ platform: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    take: 5,
  });
}

export async function getDiagnosticCreditMessage() {
  const setting = await prisma.appSetting.findUnique({ where: { key: "diagnosticCreditPolicy" } });
  const value = setting?.value as { enabled?: boolean; message?: string } | null;
  if (value?.enabled === false) return null;
  return value?.message ?? "Your diagnostic fee can be credited toward the recommended resolution.";
}

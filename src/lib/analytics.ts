import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function trackEvent(
  name: string,
  properties?: Prisma.InputJsonValue,
  context?: { userId?: string; sessionId?: string },
) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        name,
        properties: properties ?? Prisma.JsonNull,
        userId: context?.userId,
        sessionId: context?.sessionId,
      },
    });
  } catch (error) {
    console.error("analytics_failed", name, error);
  }
}

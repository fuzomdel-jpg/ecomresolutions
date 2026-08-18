import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getIntakeToken, getSessionUser } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session");
  if (!sessionId) return NextResponse.json({ error: "Missing session." }, { status: 400 });
  const intake = await prisma.intakeSession.findUnique({
    where: { id: sessionId },
    include: { recommendedService: { include: { platform: true } } },
  });
  const token = await getIntakeToken();
  const user = await getSessionUser();
  if (!intake || (intake.guestToken !== token && intake.userId !== user?.id)) {
    return NextResponse.json({ error: "We couldn't find that checkout." }, { status: 404 });
  }
  return NextResponse.json({
    authenticated: Boolean(user),
    problemText: intake.problemText,
    service: intake.recommendedService,
  });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getIntakeToken, getSessionUser, ensureOrganizationForUser } from "@/lib/auth-helpers";
import { startCheckout } from "@/lib/checkout";

export async function POST(request: Request) {
  const { sessionId } = await request.json();
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Create an account to start the resolution." }, { status: 401 });
  }
  const intake = await prisma.intakeSession.findUnique({ where: { id: sessionId } });
  const token = await getIntakeToken();
  if (!intake || (intake.guestToken !== token && intake.userId !== user.id)) {
    return NextResponse.json({ error: "We couldn't find that problem session." }, { status: 404 });
  }
  const organization = await ensureOrganizationForUser(user.id, user.email, user.name);
  await prisma.intakeSession.update({
    where: { id: intake.id },
    data: { userId: user.id, organizationId: organization.id, status: "CHECKOUT" },
  });
  try {
    const result = await startCheckout({
      intakeSessionId: intake.id,
      userId: user.id,
      organizationId: organization.id,
      email: user.email,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Something went wrong while starting checkout." },
      { status: 400 },
    );
  }
}

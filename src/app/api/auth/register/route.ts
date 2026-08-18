import { NextResponse } from "next/server";
import { signupSchema } from "@/lib/validations";
import { createCustomerAccount, getIntakeToken } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limited = rateLimit(`register:${request.headers.get("x-forwarded-for") ?? "local"}`, 10, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "Too many attempts. Please wait a minute." }, { status: 429 });
  const body = await request.json();
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid name, email, and password (8+ characters)." }, { status: 400 });
  }
  try {
    const user = await createCustomerAccount(parsed.data);
    const token = await getIntakeToken();
    if (token) {
      await prisma.intakeSession.updateMany({
        where: { guestToken: token },
        data: { userId: user.id },
      });
    }
    if (body.intakeSessionId) {
      await prisma.intakeSession.update({
        where: { id: body.intakeSessionId },
        data: { userId: user.id },
      });
    }
    return NextResponse.json({ id: user.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create the account." },
      { status: 400 },
    );
  }
}

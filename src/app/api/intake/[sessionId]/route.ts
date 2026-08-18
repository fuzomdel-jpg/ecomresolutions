import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getIntakeToken, getSessionUser } from "@/lib/auth-helpers";
import { replyToIntake } from "@/lib/intake";
import { intakeReplySchema } from "@/lib/validations";

export async function GET(_request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const session = await prisma.intakeSession.findUnique({
    where: { id: sessionId },
    include: { recommendedService: { include: { platform: true } } },
  });
  if (!session) return NextResponse.json({ error: "Session not found." }, { status: 404 });
  const token = await getIntakeToken();
  const user = await getSessionUser();
  if (session.guestToken !== token && session.userId !== user?.id) {
    return NextResponse.json({ error: "You don't have access to this problem session." }, { status: 403 });
  }
  return NextResponse.json({
    id: session.id,
    status: session.status,
    messages: session.messages,
    diagnosis: session.diagnosis,
    recommendedService: session.recommendedService,
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const body = await request.json();
  const parsed = intakeReplySchema.safeParse({ ...body, sessionId });
  if (!parsed.success) {
    return NextResponse.json({ error: "We couldn't save that reply." }, { status: 400 });
  }
  const token = await getIntakeToken();
  const user = await getSessionUser();
  try {
    const result = await replyToIntake({
      sessionId,
      guestToken: token,
      userId: user?.id,
      message: parsed.data.message,
      answers: parsed.data.answers,
      skip: parsed.data.skip,
    });
    return NextResponse.json({
      id: result.session.id,
      status: result.session.status,
      messages: result.session.messages,
      diagnosis: result.session.diagnosis,
      recommendedService: result.session.recommendedService,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Something went wrong." },
      { status: 400 },
    );
  }
}

import { NextResponse } from "next/server";
import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_BYTES, intakeStartSchema } from "@/lib/validations";
import { startIntake } from "@/lib/intake";
import { getIntakeToken, getSessionUser, setIntakeToken } from "@/lib/auth-helpers";
import { storeFile } from "@/lib/storage";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { trackEvent } from "@/lib/analytics";

export async function POST(request: Request) {
  const limited = rateLimit(`intake:${request.headers.get("x-forwarded-for") ?? "local"}`, 20);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many problem submissions. Please wait a moment." }, { status: 429 });
  }
  const form = await request.formData();
  const parsed = intakeStartSchema.safeParse({
    problemText: form.get("problemText"),
    platformSlug: form.get("platformSlug") || undefined,
    serviceSlug: form.get("serviceSlug") || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Tell us what happened." }, { status: 400 });
  }
  const user = await getSessionUser();
  const { session } = await startIntake({ ...parsed.data, userId: user?.id });
  await setIntakeToken(session.guestToken);
  await trackEvent("problem_started", { sessionId: session.id });

  const files = form.getAll("files").filter((value): value is File => value instanceof File && value.size > 0);
  for (const file of files) {
    if (!ALLOWED_UPLOAD_TYPES.includes(file.type) || file.size > MAX_UPLOAD_BYTES) continue;
    const key = await storeFile(file);
    await prisma.caseAttachment.create({
      data: {
        intakeSessionId: session.id,
        uploadedById: user?.id,
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        storageKey: key,
      },
    });
    await trackEvent("attachment_uploaded", { sessionId: session.id });
  }

  return NextResponse.json({ sessionId: session.id });
}

export async function GET() {
  const token = await getIntakeToken();
  if (!token) return NextResponse.json({ session: null });
  const session = await prisma.intakeSession.findUnique({ where: { guestToken: token } });
  return NextResponse.json({ session });
}

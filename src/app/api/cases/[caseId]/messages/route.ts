import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, userCanAccessCase } from "@/lib/auth-helpers";
import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_BYTES } from "@/lib/validations";
import { storeFile } from "@/lib/storage";
import { notifyCaseStakeholders } from "@/lib/notifications";
import { trackEvent } from "@/lib/analytics";
import { isStaff } from "@/lib/rbac";

export async function POST(request: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in to reply." }, { status: 401 });
  const { caseId } = await params;
  const allowed = await userCanAccessCase(user.id, user.role, caseId);
  if (!allowed) return NextResponse.json({ error: "You cannot access this case." }, { status: 403 });

  const form = await request.formData();
  const body = String(form.get("body") || "").trim();
  const files = form.getAll("files").filter((value): value is File => value instanceof File && value.size > 0);
  if (!body && files.length === 0) {
    return NextResponse.json({ error: "Write a reply or attach a file." }, { status: 400 });
  }

  const message = await prisma.caseMessage.create({
    data: {
      caseId,
      authorId: user.id,
      authorType: isStaff(user.role) ? "SPECIALIST" : "CUSTOMER",
      body: body || "Attachment uploaded.",
      kind: "TEXT",
    },
  });

  for (const file of files) {
    if (!ALLOWED_UPLOAD_TYPES.includes(file.type) || file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "That file type or size isn't allowed." }, { status: 400 });
    }
    const key = await storeFile(file);
    await prisma.caseAttachment.create({
      data: {
        caseId,
        messageId: message.id,
        uploadedById: user.id,
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        storageKey: key,
      },
    });
    await trackEvent("attachment_uploaded", { caseId });
  }

  await trackEvent("message_sent", { caseId });
  await notifyCaseStakeholders({
    caseId,
    type: isStaff(user.role) ? "specialist_replied" : "message_sent",
    title: isStaff(user.role) ? "Your specialist replied" : "New customer message",
    body: body.slice(0, 140),
    excludeUserId: user.id,
  });
  return NextResponse.json({ id: message.id });
}

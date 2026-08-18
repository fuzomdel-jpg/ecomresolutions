import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { readStoredFile } from "@/lib/storage";
import { isStaff } from "@/lib/rbac";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const key = new URL(request.url).searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Missing key." }, { status: 400 });
  const file = await prisma.caseAttachment.findFirst({ where: { storageKey: key } });
  if (!file) return NextResponse.json({ error: "File not found." }, { status: 404 });
  if (!isStaff(user.role) && file.uploadedById !== user.id && file.caseId) {
    const membership = await prisma.case.findFirst({
      where: { id: file.caseId, organization: { members: { some: { userId: user.id } } } },
    });
    if (!membership) return NextResponse.json({ error: "You cannot access this file." }, { status: 403 });
  }
  const bytes = await readStoredFile(key);
  return new NextResponse(new Uint8Array(bytes), { headers: { "Content-Type": file.mimeType } });
}

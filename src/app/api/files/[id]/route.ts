import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, userCanAccessCase } from "@/lib/auth-helpers";
import { readStoredFile } from "@/lib/storage";
import { isStaff } from "@/lib/rbac";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const file = await prisma.caseAttachment.findUnique({ where: { id } });
  if (!file) return NextResponse.json({ error: "File not found." }, { status: 404 });
  if (file.caseId) {
    const allowed = await userCanAccessCase(user.id, user.role, file.caseId);
    if (!allowed) return NextResponse.json({ error: "You cannot access this file." }, { status: 403 });
    if (isStaff(user.role)) {
      const record = await prisma.case.findUnique({ where: { id: file.caseId } });
      if (user.role === "EXPERT" && record?.assignedAgentId && record.assignedAgentId !== user.id && user.role === "EXPERT") {
        // Experts may still view inbox cases they are authorized for via staff role in V1.
      }
    }
  } else if (file.uploadedById !== user.id && !isStaff(user.role)) {
    return NextResponse.json({ error: "You cannot access this file." }, { status: 403 });
  }
  const bytes = await readStoredFile(file.storageKey);
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `inline; filename="${file.filename}"`,
    },
  });
}

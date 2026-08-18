import { cookies } from "next/headers";
import { hash } from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { organizationNameFromEmail, slugify } from "@/lib/utils";
import { auth } from "@/auth";
import { isStaff } from "@/lib/rbac";

export const INTAKE_COOKIE = "er_intake";

export async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { memberships: { include: { organization: true } } },
  });
  return user;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireStaff() {
  const user = await requireUser();
  if (!isStaff(user.role)) {
    throw new Error("Forbidden");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN) {
    throw new Error("Forbidden");
  }
  return user;
}

export async function getIntakeToken() {
  const store = await cookies();
  return store.get(INTAKE_COOKIE)?.value ?? null;
}

export async function setIntakeToken(token: string) {
  const store = await cookies();
  store.set(INTAKE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function ensureOrganizationForUser(userId: string, email: string, name?: string | null) {
  const existing = await prisma.organizationMember.findFirst({
    where: { userId },
    include: { organization: true },
  });
  if (existing) return existing.organization;

  const base = slugify(organizationNameFromEmail(email) || name || "workspace");
  let slug = base;
  let i = 1;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }
  return prisma.organization.create({
    data: {
      name: name || organizationNameFromEmail(email),
      slug,
      members: { create: { userId, orgRole: "OWNER" } },
    },
  });
}

export async function createCustomerAccount(input: { name: string; email: string; password: string }) {
  const email = input.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("An account with this email already exists.");
  }
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email,
      passwordHash: await hash(input.password, 12),
      role: Role.CUSTOMER,
    },
  });
  await ensureOrganizationForUser(user.id, user.email, user.name);
  return user;
}

export async function userCanAccessCase(userId: string, role: Role, caseId: string) {
  const record = await prisma.case.findUnique({ where: { id: caseId } });
  if (!record) return false;
  if (isStaff(role)) return true;
  if (record.customerId === userId) return true;
  const membership = await prisma.organizationMember.findFirst({
    where: { userId, organizationId: record.organizationId },
  });
  return Boolean(membership);
}

import { Role } from "@prisma/client";

export const staffRoles: Role[] = [Role.EXPERT, Role.ADMIN, Role.SUPER_ADMIN];
export const adminRoles: Role[] = [Role.ADMIN, Role.SUPER_ADMIN];

export function isStaff(role?: Role | null) {
  return !!role && staffRoles.includes(role);
}

export function isAdmin(role?: Role | null) {
  return !!role && adminRoles.includes(role);
}

export function canManageServices(role?: Role | null) {
  return isAdmin(role);
}

export function canRefund(role?: Role | null) {
  return isAdmin(role);
}

export function canChangePrice(role?: Role | null) {
  return isAdmin(role);
}

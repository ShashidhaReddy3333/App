import type { Route } from "next";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import type { Permission } from "@/lib/auth/permissions";
import { getCurrentSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

export function getPostSignInPath(role: UserRole): Route {
  if (role === "customer") {
    return "/shop" as Route;
  }
  if (role === "supplier") {
    return "/supplier/dashboard" as Route;
  }
  if (role === "platform_admin") {
    return "/admin" as Route;
  }
  return "/app/dashboard" as Route;
}

export async function requireAnySession() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/sign-in");
  }
  return session;
}

export async function requireAppSession() {
  const session = await requireAnySession();
  if (!session.user.businessId) {
    redirect("/sign-in");
  }
  return session;
}

export async function requirePermission(permission: Permission) {
  const session = await requireAppSession();
  if (!hasPermission(session.user.role, permission)) {
    redirect("/app/forbidden");
  }
  return session;
}

export async function requireRole(
  role: UserRole,
  forbiddenPath: Route = "/app/forbidden" as Route
) {
  const session = await requireAnySession();
  if (session.user.role !== role) {
    redirect(forbiddenPath);
  }
  return session;
}

export async function requireRoles(
  roles: UserRole[],
  forbiddenPath: Route = "/app/forbidden" as Route
) {
  const session = await requireAnySession();
  if (!roles.includes(session.user.role)) {
    redirect(forbiddenPath);
  }
  return session;
}

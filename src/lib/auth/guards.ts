import type { UserRole } from "@prisma/client";
import type { Route } from "next";
import { redirect } from "next/navigation";

import type { Permission } from "@/lib/auth/permissions";
import { getCurrentSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import {
  getCurrentPortal,
  getLegacyPostSignInPath,
  getPortalPostSignInPath,
  isRoleAllowedInPortal,
  type Portal,
} from "@/lib/portal";

export function getPostSignInPath(role: UserRole, portal: Portal = "main"): Route {
  const path =
    portal === "main" ? getLegacyPostSignInPath(role) : getPortalPostSignInPath(portal, role);
  return path as Route;
}

async function getForbiddenPath(): Promise<Route> {
  const portal = await getCurrentPortal();

  if (portal === "shop") {
    return "/sign-in" as Route;
  }

  if (portal === "admin") {
    return "/admin" as Route;
  }

  return "/forbidden" as Route;
}

async function assertSessionMatchesPortal(
  session: NonNullable<Awaited<ReturnType<typeof getCurrentSession>>>
) {
  const portal = await getCurrentPortal();

  if (portal !== "main" && !isRoleAllowedInPortal(portal, session.user.role)) {
    redirect("/sign-in");
  }

  return session;
}

export async function requireAnySession() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/sign-in");
  }

  return assertSessionMatchesPortal(session);
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
    redirect(await getForbiddenPath());
  }
  return session;
}

export async function requireRole(role: UserRole, forbiddenPath?: Route) {
  const session = await requireAnySession();
  if (session.user.role !== role) {
    redirect(forbiddenPath ?? (await getForbiddenPath()));
  }
  return session;
}

export async function requireRoles(roles: UserRole[], forbiddenPath?: Route) {
  const session = await requireAnySession();
  if (!roles.includes(session.user.role)) {
    redirect(forbiddenPath ?? (await getForbiddenPath()));
  }
  return session;
}

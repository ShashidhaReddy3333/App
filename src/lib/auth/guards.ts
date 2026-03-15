import type { Route } from "next";
import { redirect } from "next/navigation";

import type { Permission } from "@/lib/auth/permissions";
import { getCurrentSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

export async function requireAppSession() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/sign-in");
  }
  if (!session.user.businessId) {
    redirect("/sign-in");
  }
  return session;
}

export async function requirePermission(permission: Permission) {
  const session = await requireAppSession();
  if (!hasPermission(session.user.role, permission)) {
    redirect("/app/forbidden" as Route);
  }
  return session;
}

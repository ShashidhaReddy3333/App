import { UserRole } from "@prisma/client";

import { getCurrentSession } from "@/lib/auth/session";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { validateCsrfToken } from "@/lib/csrf";
import { forbiddenError, unauthorizedError } from "@/lib/errors";
import { getCurrentPortal, isRoleAllowedInPortal } from "@/lib/portal";
import { getRequestOrigin, isAllowedRequestOrigin, isSafeMethod } from "@/lib/security/csrf";

let hasWarnedAboutMissingRequest = false;

/** Routes that are exempt from CSRF validation (no session yet, or bootstrapping). */
const CSRF_EXEMPT_PATHS = [
  "/api/auth/customer/sign-in",
  "/api/auth/customer/sign-up",
  "/api/auth/retail/sign-in",
  "/api/auth/retail/sign-up",
  "/api/auth/supplier/sign-in",
  "/api/auth/supplier/sign-up",
  "/api/auth/admin/sign-in",
  "/api/auth/csrf-token",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-email",
  "/api/health",
] as const;

type RequireApiAccessOptions = {
  allowMissingBusiness?: boolean;
  roles?: UserRole[];
  request?: Request;
};

function isCsrfExempt(request: Request): boolean {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Internal routes use CRON_SECRET authentication
  if (pathname.startsWith("/api/internal/")) return true;

  return CSRF_EXEMPT_PATHS.some((path) => pathname === path || pathname.startsWith(path + "/"));
}

async function validateRequestCsrf(request: Request) {
  if (isSafeMethod(request.method) || isCsrfExempt(request)) {
    return;
  }

  if (!isAllowedRequestOrigin(request, getRequestOrigin(request))) {
    throw forbiddenError("CSRF validation failed.");
  }

  const valid = await validateCsrfToken(request);
  if (!valid) {
    throw forbiddenError("Invalid CSRF token");
  }
}

export async function requireApiAccess(permission?: Permission, options?: RequireApiAccessOptions) {
  if (!options?.request && !hasWarnedAboutMissingRequest) {
    hasWarnedAboutMissingRequest = true;
    console.warn(
      "[requireApiAccess] Missing request object. Pass options.request from route handlers so CSRF validation runs for state-changing methods."
    );
  }

  if (options?.request) {
    await validateRequestCsrf(options.request);
  }

  const session = await getCurrentSession();
  if (!session) {
    throw unauthorizedError();
  }

  const portal = await getCurrentPortal();
  if (portal !== "main" && !isRoleAllowedInPortal(portal, session.user.role)) {
    throw forbiddenError("This account cannot access the current portal.");
  }

  if (options?.roles && !options.roles.includes(session.user.role)) {
    throw forbiddenError();
  }
  if (!options?.allowMissingBusiness && !session.user.businessId) {
    throw unauthorizedError("Your account is not attached to a business.");
  }
  if (permission && !hasPermission(session.user.role, permission)) {
    throw forbiddenError();
  }

  return {
    session,
    businessId: session.user.businessId as string,
  };
}

export async function requirePlatformAdminAccess(request?: Request) {
  if (request) {
    await validateRequestCsrf(request);
  }

  const session = await getCurrentSession();
  if (!session) {
    throw unauthorizedError();
  }
  const portal = await getCurrentPortal();
  if (portal !== "main" && !isRoleAllowedInPortal(portal, session.user.role)) {
    throw forbiddenError("This account cannot access the current portal.");
  }
  if (session.user.role !== "platform_admin") {
    throw forbiddenError();
  }

  return session;
}

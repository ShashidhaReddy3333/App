import { UserRole } from "@prisma/client";

import { getCurrentSession } from "@/lib/auth/session";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { validateCsrfToken } from "@/lib/csrf";
import { forbiddenError, unauthorizedError } from "@/lib/errors";

/** Routes that are exempt from CSRF validation (no session yet, or bootstrapping). */
const CSRF_EXEMPT_PATHS = [
  "/api/auth/sign-in",
  "/api/auth/sign-up",
  "/api/auth/customer-sign-up",
  "/api/auth/supplier-sign-up",
  "/api/auth/csrf-token",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-email",
  "/api/health",
];

function isCsrfExempt(request: Request): boolean {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Internal routes use CRON_SECRET authentication
  if (pathname.startsWith("/api/internal/")) return true;

  return CSRF_EXEMPT_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
}

const STATE_CHANGING_METHODS = new Set(["POST", "PATCH", "DELETE", "PUT"]);

export async function requireApiAccess(
  permission?: Permission,
  options?: { allowMissingBusiness?: boolean; roles?: UserRole[]; request?: Request }
) {
  const session = await getCurrentSession();
  if (!session) {
    throw unauthorizedError();
  }

  // CSRF validation for state-changing methods
  if (options?.request && STATE_CHANGING_METHODS.has(options.request.method.toUpperCase())) {
    if (!isCsrfExempt(options.request)) {
      const valid = await validateCsrfToken(options.request);
      if (!valid) {
        throw forbiddenError("Invalid CSRF token");
      }
    }
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
    businessId: session.user.businessId as string
  };
}

import { UserRole } from "@prisma/client";

import { getCurrentSession } from "@/lib/auth/session";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { forbiddenError, unauthorizedError } from "@/lib/errors";
import { getRequestOrigin, isAllowedOrigin, isSafeMethod } from "@/lib/security/csrf";

let hasWarnedAboutMissingRequest = false;

type RequireApiAccessOptions = {
  allowMissingBusiness?: boolean;
  roles?: UserRole[];
  request?: Request;
};

export async function requireApiAccess(permission?: Permission, options?: RequireApiAccessOptions) {
  if (!options?.request && !hasWarnedAboutMissingRequest) {
    hasWarnedAboutMissingRequest = true;
    console.warn("[requireApiAccess] Missing request object. Pass options.request from route handlers so CSRF validation runs for state-changing methods.");
  }

  if (options?.request && !isSafeMethod(options.request.method) && !isAllowedOrigin(getRequestOrigin(options.request))) {
    throw forbiddenError("CSRF validation failed.");
  }

  const session = await getCurrentSession();
  if (!session) {
    throw unauthorizedError();
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

export async function requirePlatformAdminAccess() {
  const session = await getCurrentSession();
  if (!session) {
    throw unauthorizedError();
  }
  if (session.user.role !== "platform_admin") {
    throw forbiddenError();
  }

  return session;
}

import { UserRole } from "@prisma/client";

import { getCurrentSession } from "@/lib/auth/session";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { forbiddenError, unauthorizedError } from "@/lib/errors";

export async function requireApiAccess(permission?: Permission, options?: { allowMissingBusiness?: boolean; roles?: UserRole[] }) {
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

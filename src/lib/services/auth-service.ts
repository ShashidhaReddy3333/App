import { BusinessType, TaxMode, UserRole, UserStatus } from "@prisma/client";

import { logAudit } from "@/lib/audit";
import { sendPasswordResetEmail, sendStaffInviteEmail } from "@/lib/auth/mailer";
import { createOpaqueToken, hashToken } from "@/lib/auth/token";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { conflictError, notFoundError, validationError } from "@/lib/errors";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  customerSignUpSchema,
  forgotPasswordSchema,
  inviteStaffSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  supplierSignUpSchema
} from "@/lib/schemas/auth";

const LOGIN_WINDOW_MINUTES = 15;
const LOGIN_ATTEMPT_LIMIT = 5;
const PASSWORD_RESET_WINDOW_MINUTES = 30;
const PASSWORD_RESET_LIMIT = 3;
const STAFF_INVITE_WINDOW_MINUTES = 60;
const STAFF_INVITE_LIMIT = 10;

async function assertLoginNotBlocked(email: string, ipAddress: string | null) {
  const throttleIpAddress = ipAddress ?? "unknown";
  const throttle = await db.authThrottle.findUnique({
    where: {
      email_ipAddress: {
        email,
        ipAddress: throttleIpAddress
      }
    }
  });

  if (throttle?.blockedUntil && throttle.blockedUntil > new Date()) {
    throw conflictError("Too many failed sign-in attempts. Please try again later.");
  }
}

async function registerFailedLogin(email: string, ipAddress: string | null) {
  const throttleIpAddress = ipAddress ?? "unknown";
  const existing = await db.authThrottle.findUnique({
    where: {
      email_ipAddress: {
        email,
        ipAddress: throttleIpAddress
      }
    }
  });

  const now = new Date();
  const stale = existing?.lastFailedAt ? now.getTime() - existing.lastFailedAt.getTime() > LOGIN_WINDOW_MINUTES * 60 * 1000 : true;
  const failedCount = stale ? 1 : (existing?.failedCount ?? 0) + 1;
  const blockedUntil = failedCount >= LOGIN_ATTEMPT_LIMIT ? new Date(now.getTime() + LOGIN_WINDOW_MINUTES * 60 * 1000) : null;

  await db.authThrottle.upsert({
    where: {
      email_ipAddress: {
        email,
        ipAddress: throttleIpAddress
      }
    },
    create: {
      email,
      ipAddress: throttleIpAddress,
      failedCount,
      lastFailedAt: now,
      blockedUntil
    },
    update: {
      failedCount,
      lastFailedAt: now,
      blockedUntil
    }
  });
}

async function clearLoginFailures(email: string, ipAddress: string | null) {
  const throttleIpAddress = ipAddress ?? "unknown";
  await db.authThrottle.deleteMany({
    where: {
      email,
      ipAddress: throttleIpAddress
    }
  });
}

async function assertPasswordResetNotThrottled(userId: string) {
  const windowStart = new Date(Date.now() - PASSWORD_RESET_WINDOW_MINUTES * 60 * 1000);
  const recentCount = await db.passwordResetToken.count({
    where: {
      userId,
      createdAt: { gte: windowStart }
    }
  });

  if (recentCount >= PASSWORD_RESET_LIMIT) {
    throw conflictError("Too many password reset requests. Please try again later.");
  }
}

async function assertInviteNotThrottled(businessId: string, email: string) {
  const windowStart = new Date(Date.now() - STAFF_INVITE_WINDOW_MINUTES * 60 * 1000);
  const recentCount = await db.staffInviteToken.count({
    where: {
      businessId,
      email,
      createdAt: { gte: windowStart }
    }
  });

  if (recentCount >= STAFF_INVITE_LIMIT) {
    throw conflictError("Too many invites were sent to this address recently. Please try again later.");
  }
}

function duplicateEmailError() {
  return validationError("An account with this email already exists.", {
    fieldErrors: {
      email: ["An account with this email already exists."]
    }
  });
}

export async function registerOwner(input: unknown) {
  const values = signUpSchema.parse(input);
  const normalizedEmail = values.email.toLowerCase();
  const existingUser = await db.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (existingUser) {
    throw duplicateEmailError();
  }

  const passwordHash = await hashPassword(values.password);

  return db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        fullName: values.ownerName,
        email: normalizedEmail,
        passwordHash,
        status: UserStatus.active,
        role: UserRole.owner,
        notificationPreference: {
          create: {}
        }
      }
    });

    const business = await tx.business.create({
      data: {
        ownerId: user.id,
        businessName: values.businessName,
        businessType: values.businessType as BusinessType,
        primaryCountry: values.primaryCountry,
        timezone: values.timezone,
        currency: values.currency.toUpperCase(),
        taxMode: values.taxMode as TaxMode,
        users: {
          connect: {
            id: user.id
          }
        },
        locations: {
          create: {
            name: "Main Location",
            addressLine1: values.addressLine1,
            city: values.city,
            provinceOrState: values.provinceOrState,
            postalCode: values.postalCode,
            country: values.primaryCountry,
            timezone: values.timezone
          }
        }
      },
      include: {
        locations: true
      }
    });

    await tx.user.update({
      where: { id: user.id },
      data: { businessId: business.id }
    });

    if (values.defaultTaxName && typeof values.defaultTaxRate === "number") {
      await tx.taxRate.create({
        data: {
          businessId: business.id,
          name: values.defaultTaxName,
          ratePercent: values.defaultTaxRate,
          isDefault: true,
          isInclusive: values.taxMode === "inclusive_tax"
        }
      });
    }

    await logAudit({
      tx,
      businessId: business.id,
      actorUserId: user.id,
      action: "business_created",
      resourceType: "business",
      resourceId: business.id,
      metadata: { businessName: business.businessName }
    });

    return { user, business };
  });
}

export async function registerCustomer(input: unknown) {
  const values = customerSignUpSchema.parse(input);
  const normalizedEmail = values.email.toLowerCase();
  const existingUser = await db.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (existingUser) {
    throw duplicateEmailError();
  }

  const passwordHash = await hashPassword(values.password);
  const user = await db.user.create({
    data: {
      fullName: values.fullName,
      email: normalizedEmail,
      passwordHash,
      status: UserStatus.active,
      role: UserRole.customer,
      customerProfile: {
        create: {}
      },
      notificationPreference: {
        create: {}
      }
    }
  });

  return user;
}

export async function registerSupplierUser(input: unknown) {
  const values = supplierSignUpSchema.parse(input);
  const normalizedEmail = values.email.toLowerCase();
  const existingUser = await db.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (existingUser) {
    throw duplicateEmailError();
  }

  const business = await db.business.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" }
  });

  if (!business) {
    throw notFoundError("An active retailer business is required before supplier onboarding.");
  }

  const passwordHash = await hashPassword(values.password);

  return db.$transaction(async (tx) => {
    const supplier = await tx.supplier.create({
      data: {
        businessId: business.id,
        name: values.businessName,
        contactName: values.fullName,
        email: normalizedEmail,
        phone: values.phone || null,
        notes: values.notes || null
      }
    });

    const user = await tx.user.create({
      data: {
        businessId: business.id,
        supplierId: supplier.id,
        fullName: values.fullName,
        email: normalizedEmail,
        passwordHash,
        status: UserStatus.active,
        role: UserRole.supplier,
        notificationPreference: {
          create: {}
        }
      }
    });

    await logAudit({
      tx,
      businessId: business.id,
      actorUserId: user.id,
      action: "supplier_portal_onboarded",
      resourceType: "supplier",
      resourceId: supplier.id,
      metadata: { supplierName: supplier.name }
    });

    return user;
  });
}

export async function authenticateUser(input: unknown, ipAddress: string | null) {
  const values = signInSchema.parse(input);
  const email = values.email.toLowerCase();
  await assertLoginNotBlocked(email, ipAddress);

  const user = await db.user.findUnique({
    where: { email },
    include: { business: true }
  });

  if (!user || !user.passwordHash) {
    await registerFailedLogin(email, ipAddress);
    throw validationError("Invalid email or password.", {
      fieldErrors: {
        email: ["Invalid email or password."],
        password: ["Invalid email or password."]
      }
    });
  }

  if (user.status === UserStatus.invited) {
    throw conflictError("Your account invitation is pending. Please accept the invite email to activate your account.");
  }

  const isValidPassword = await verifyPassword(values.password, user.passwordHash);
  if (!isValidPassword) {
    await registerFailedLogin(email, ipAddress);
    throw validationError("Invalid email or password.", {
      fieldErrors: {
        email: ["Invalid email or password."],
        password: ["Invalid email or password."]
      }
    });
  }

  await clearLoginFailures(email, ipAddress);
  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  return user;
}

export async function beginPasswordReset(input: unknown, ipAddress: string | null) {
  const values = forgotPasswordSchema.parse(input);
  const email = values.email.toLowerCase();
  const user = await db.user.findUnique({ where: { email } });

  if (!user) {
    return { ok: true, devToken: null };
  }

  await assertPasswordResetNotThrottled(user.id);

  const rawToken = createOpaqueToken();
  const resetToken = await db.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + 1000 * 60 * 30)
    }
  });

  if (env.DEMO_MODE !== "true") {
    try {
      await sendPasswordResetEmail(email, rawToken);
    } catch (error) {
      await db.passwordResetToken.delete({
        where: { id: resetToken.id }
      });
      throw error;
    }
  }

  if (user.businessId) {
    await logAudit({
      businessId: user.businessId,
      actorUserId: user.id,
      action: "password_reset_requested",
      resourceType: "password_reset",
      resourceId: user.id,
      metadata: {},
      ipAddress
    });
  }

  return {
    ok: true,
    devToken: env.DEMO_MODE === "true" ? rawToken : null
  };
}

export async function completePasswordReset(input: unknown) {
  const values = resetPasswordSchema.parse(input);
  const user = await db.user.findUnique({
    where: { email: values.email.toLowerCase() }
  });

  if (!user) {
    throw validationError("Invalid password reset request.");
  }

  const tokenHash = hashToken(values.token);
  const resetToken = await db.passwordResetToken.findFirst({
    where: {
      userId: user.id,
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() }
    }
  });

  if (!resetToken) {
    throw validationError("Reset token is invalid or expired.", {
      fieldErrors: {
        token: ["Reset token is invalid or expired."]
      }
    });
  }

  const passwordHash = await hashPassword(values.password);
  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { passwordHash }
    }),
    db.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() }
    }),
    db.session.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() }
    })
  ]);

  return { ok: true };
}

export async function inviteStaff(actorUserId: string, input: unknown, ipAddress: string | null) {
  const values = inviteStaffSchema.parse(input);
  const actor = await db.user.findUnique({
    where: { id: actorUserId }
  });

  if (!actor?.businessId) {
    throw notFoundError("Business context not found.");
  }

  const businessId = actor.businessId;
  const token = createOpaqueToken();
  const normalizedEmail = values.email.toLowerCase();
  await assertInviteNotThrottled(businessId, normalizedEmail);

  const invite = await db.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({
      where: { email: normalizedEmail }
    });
    if (existingUser) {
      throw validationError("A user with this email already exists.", {
        fieldErrors: {
          email: ["A user with this email already exists."]
        }
      });
    }

    await tx.staffInviteToken.updateMany({
      where: {
        businessId,
        email: normalizedEmail,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() }
      },
      data: { revokedAt: new Date() }
    });

    const invite = await tx.staffInviteToken.create({
      data: {
        businessId,
        email: normalizedEmail,
        role: values.role,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        invitedByUserId: actorUserId
      }
    });

    return invite;
  });

  if (env.DEMO_MODE !== "true") {
    try {
      await sendStaffInviteEmail(normalizedEmail, token);
    } catch (error) {
      await db.staffInviteToken.update({
        where: { id: invite.id },
        data: { revokedAt: new Date() }
      });
      throw error;
    }
  }

  await logAudit({
    businessId,
    actorUserId,
    action: "invite_sent",
    resourceType: "staff_invite",
    resourceId: invite.id,
    metadata: { email: normalizedEmail, role: values.role },
    ipAddress
  });

  return {
    invite,
    token: env.DEMO_MODE === "true" ? token : null
  };
}

export async function acceptInvite(token: string, fullName: string, password: string) {
  const tokenHash = hashToken(token);
  const invite = await db.staffInviteToken.findFirst({
    where: {
      tokenHash,
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { gt: new Date() }
    }
  });

  if (!invite) {
    throw validationError("Invite token is invalid or expired.", {
      fieldErrors: {
        token: ["Invite token is invalid or expired."]
      }
    });
  }

  const existingUser = await db.user.findUnique({
    where: { email: invite.email }
  });
  if (existingUser) {
    throw validationError("A user with this email already exists.");
  }

  const passwordHash = await hashPassword(password);
  return db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        businessId: invite.businessId,
        fullName,
        email: invite.email,
        passwordHash,
        role: invite.role,
        status: UserStatus.active,
        notificationPreference: {
          create: {}
        }
      }
    });

    await tx.staffInviteToken.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() }
    });

    await logAudit({
      tx,
      businessId: invite.businessId,
      actorUserId: user.id,
      action: "invite_accepted",
      resourceType: "staff_invite",
      resourceId: invite.id,
      metadata: { email: invite.email }
    });

    return user;
  });
}

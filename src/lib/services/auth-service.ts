import { BusinessType, TaxMode, UserRole, UserStatus } from "@prisma/client";
import { z } from "zod";

import { logAudit } from "@/lib/audit";
import {
  sendEmailVerificationEmail,
  sendPasswordResetEmail,
  sendSupplierAccessApprovedEmail,
  sendSupplierAccessRejectedEmail,
  sendStaffInviteEmail,
} from "@/lib/auth/mailer";
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
  supplierSignUpSchema,
} from "@/lib/schemas/auth";

const LOGIN_WINDOW_MINUTES = 15;
const LOGIN_ATTEMPT_LIMIT = 5;
const PASSWORD_RESET_WINDOW_MINUTES = 30;
const PASSWORD_RESET_LIMIT = 3;
const STAFF_INVITE_WINDOW_MINUTES = 60;
const STAFF_INVITE_LIMIT = 10;
const EMAIL_VERIFICATION_EXPIRY_HOURS = 24;
const RESEND_VERIFICATION_COOLDOWN_SECONDS = 60;

async function assertLoginNotBlocked(email: string, ipAddress: string | null) {
  const throttleIpAddress = ipAddress ?? "unknown";
  const throttle = await db.authThrottle.findUnique({
    where: {
      email_ipAddress: {
        email,
        ipAddress: throttleIpAddress,
      },
    },
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
        ipAddress: throttleIpAddress,
      },
    },
  });

  const now = new Date();
  const stale = existing?.lastFailedAt
    ? now.getTime() - existing.lastFailedAt.getTime() > LOGIN_WINDOW_MINUTES * 60 * 1000
    : true;
  const failedCount = stale ? 1 : (existing?.failedCount ?? 0) + 1;
  const blockedUntil =
    failedCount >= LOGIN_ATTEMPT_LIMIT
      ? new Date(now.getTime() + LOGIN_WINDOW_MINUTES * 60 * 1000)
      : null;

  await db.authThrottle.upsert({
    where: {
      email_ipAddress: {
        email,
        ipAddress: throttleIpAddress,
      },
    },
    create: {
      email,
      ipAddress: throttleIpAddress,
      failedCount,
      lastFailedAt: now,
      blockedUntil,
    },
    update: {
      failedCount,
      lastFailedAt: now,
      blockedUntil,
    },
  });
}

async function clearLoginFailures(email: string, ipAddress: string | null) {
  const throttleIpAddress = ipAddress ?? "unknown";
  await db.authThrottle.deleteMany({
    where: {
      email,
      ipAddress: throttleIpAddress,
    },
  });
}

async function assertPasswordResetNotThrottled(userId: string) {
  const windowStart = new Date(Date.now() - PASSWORD_RESET_WINDOW_MINUTES * 60 * 1000);
  const recentCount = await db.passwordResetToken.count({
    where: {
      userId,
      createdAt: { gte: windowStart },
    },
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
      createdAt: { gte: windowStart },
    },
  });

  if (recentCount >= STAFF_INVITE_LIMIT) {
    throw conflictError(
      "Too many invites were sent to this address recently. Please try again later."
    );
  }
}

export async function generateVerificationToken(userId: string) {
  const rawToken = createOpaqueToken();
  await db.emailVerificationToken.create({
    data: {
      userId,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000),
    },
  });
  return rawToken;
}

export async function verifyEmail(email: string, token: string) {
  const normalizedEmail = email.toLowerCase();
  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw validationError("Invalid verification request.");
  }

  if (user.emailVerifiedAt) {
    return { ok: true, alreadyVerified: true };
  }

  const tokenHash = hashToken(token);
  const verificationToken = await db.emailVerificationToken.findFirst({
    where: {
      userId: user.id,
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!verificationToken) {
    throw validationError("Verification link is invalid or expired.", {
      fieldErrors: {
        token: ["Verification link is invalid or expired."],
      },
    });
  }

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    });

    await tx.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { usedAt: new Date() },
    });
  });

  return { ok: true, alreadyVerified: false };
}

export async function resendVerificationEmail(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw notFoundError("User not found.");
  }

  if (user.emailVerifiedAt) {
    return { ok: true, alreadyVerified: true };
  }

  // Rate limit: check last token creation time
  const recentToken = await db.emailVerificationToken.findFirst({
    where: {
      userId,
      createdAt: { gte: new Date(Date.now() - RESEND_VERIFICATION_COOLDOWN_SECONDS * 1000) },
    },
    orderBy: { createdAt: "desc" },
  });

  if (recentToken) {
    throw conflictError("Please wait before requesting another verification email.");
  }

  const rawToken = await generateVerificationToken(userId);

  if (env.DEMO_MODE !== "true") {
    await sendEmailVerificationEmail(user.email, rawToken, user.role);
  }

  return { ok: true, alreadyVerified: false };
}

async function sendVerificationForNewUser(userId: string, email: string, role: UserRole) {
  if (env.DEMO_MODE === "true") {
    // In demo mode, auto-verify for convenience
    await db.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
    });
    return;
  }

  const rawToken = await generateVerificationToken(userId);
  try {
    await sendEmailVerificationEmail(email, rawToken, role);
  } catch {
    // If email sending fails, still allow sign-up but user can resend later
  }
}

function duplicateEmailError() {
  return validationError("An account with this email already exists.", {
    fieldErrors: {
      email: ["An account with this email already exists."],
    },
  });
}

const supplierOnboardingReviewSchema = z.discriminatedUnion("action", [
  z.object({
    requestId: z.string().min(1),
    action: z.literal("approve"),
    businessId: z.string().min(1),
  }),
  z.object({
    requestId: z.string().min(1),
    action: z.literal("reject"),
    rejectionReason: z.string().trim().max(240).optional().or(z.literal("")),
  }),
]);

export async function registerOwner(input: unknown) {
  const values = signUpSchema.parse(input);
  const normalizedEmail = values.email.toLowerCase();
  const existingUser = await db.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw duplicateEmailError();
  }

  const passwordHash = await hashPassword(values.password);

  const result = await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        fullName: values.ownerName,
        email: normalizedEmail,
        passwordHash,
        status: UserStatus.active,
        role: UserRole.owner,
        notificationPreference: {
          create: {},
        },
      },
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
            id: user.id,
          },
        },
        locations: {
          create: {
            name: "Main Location",
            addressLine1: values.addressLine1,
            city: values.city,
            provinceOrState: values.provinceOrState,
            postalCode: values.postalCode,
            country: values.primaryCountry,
            timezone: values.timezone,
          },
        },
      },
      include: {
        locations: true,
      },
    });

    await tx.user.update({
      where: { id: user.id },
      data: { businessId: business.id },
    });

    if (values.defaultTaxName && typeof values.defaultTaxRate === "number") {
      await tx.taxRate.create({
        data: {
          businessId: business.id,
          name: values.defaultTaxName,
          ratePercent: values.defaultTaxRate,
          isDefault: true,
          isInclusive: values.taxMode === "inclusive_tax",
        },
      });
    }

    await logAudit({
      tx,
      businessId: business.id,
      actorUserId: user.id,
      action: "business_created",
      resourceType: "business",
      resourceId: business.id,
      metadata: { businessName: business.businessName },
    });

    return { user, business };
  });

  await sendVerificationForNewUser(result.user.id, normalizedEmail, result.user.role);

  return result;
}

export async function registerCustomer(input: unknown) {
  const values = customerSignUpSchema.parse(input);
  const normalizedEmail = values.email.toLowerCase();
  const existingUser = await db.user.findUnique({
    where: { email: normalizedEmail },
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
        create: {},
      },
      notificationPreference: {
        create: {},
      },
    },
  });

  await sendVerificationForNewUser(user.id, normalizedEmail, user.role);

  return user;
}

export async function createSupplierOnboardingRequest(input: unknown) {
  const values = supplierSignUpSchema.parse(input);
  const normalizedEmail = values.email.toLowerCase();
  const existingUser = await db.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw duplicateEmailError();
  }

  const existingRequest = await db.supplierOnboardingRequest.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingRequest && existingRequest.status === "pending") {
    throw conflictError("A supplier access request for this email is already pending review.");
  }

  const passwordHash = await hashPassword(values.password);
  return db.supplierOnboardingRequest.upsert({
    where: { email: normalizedEmail },
    create: {
      fullName: values.fullName,
      businessName: values.businessName,
      email: normalizedEmail,
      passwordHash,
      phone: values.phone || null,
      notes: values.notes || null,
      status: "pending",
    },
    update: {
      fullName: values.fullName,
      businessName: values.businessName,
      passwordHash,
      phone: values.phone || null,
      notes: values.notes || null,
      status: "pending",
      reviewedByAdminId: null,
      approvedBusinessId: null,
      approvedSupplierId: null,
      approvedSupplierOrganizationId: null,
      approvedUserId: null,
      rejectionReason: null,
      reviewedAt: null,
    },
  });
}

export async function listSupplierOnboardingRequests(options?: {
  page?: number;
  limit?: number;
  status?: "pending" | "approved" | "rejected";
}) {
  const page = Math.max(1, options?.page ?? 1);
  const limit = Math.min(Math.max(1, options?.limit ?? 25), 100);
  const skip = (page - 1) * limit;
  const where = options?.status ? { status: options.status } : {};

  const [requests, total, counts] = await Promise.all([
    db.supplierOnboardingRequest.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip,
      take: limit,
    }),
    db.supplierOnboardingRequest.count({ where }),
    db.supplierOnboardingRequest.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  return {
    requests,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    counts: {
      pending: counts.find((entry) => entry.status === "pending")?._count._all ?? 0,
      approved: counts.find((entry) => entry.status === "approved")?._count._all ?? 0,
      rejected: counts.find((entry) => entry.status === "rejected")?._count._all ?? 0,
    },
  };
}

export async function reviewSupplierOnboardingRequest(adminUserId: string, input: unknown) {
  const values = supplierOnboardingReviewSchema.parse(input);
  const request = await db.supplierOnboardingRequest.findUnique({
    where: { id: values.requestId },
  });

  if (!request) {
    throw notFoundError("Supplier access request not found.");
  }

  if (request.status !== "pending") {
    throw conflictError(`Supplier access request has already been ${request.status}.`);
  }

  if (values.action === "reject") {
    const rejectionReason = values.rejectionReason?.trim() || "Request declined by admin review.";
    const reviewedRequest = await db.supplierOnboardingRequest.update({
      where: { id: request.id },
      data: {
        status: "rejected",
        reviewedByAdminId: adminUserId,
        rejectionReason,
        reviewedAt: new Date(),
        approvedBusinessId: null,
        approvedSupplierId: null,
        approvedSupplierOrganizationId: null,
        approvedUserId: null,
      },
    });

    if (env.DEMO_MODE !== "true") {
      try {
        await sendSupplierAccessRejectedEmail(request.email, rejectionReason);
      } catch {
        // Rejection email delivery should not block the review action.
      }
    }

    return {
      request: reviewedRequest,
      supplierOrganization: null,
      supplier: null,
      user: null,
    };
  }

  const approved = await db.$transaction(async (tx) => {
    const business = await tx.business.findFirst({
      where: { id: values.businessId, isActive: true },
      select: { id: true, businessName: true },
    });

    if (!business) {
      throw notFoundError("Selected business not found.");
    }

    const existingUser = await tx.user.findUnique({
      where: { email: request.email },
    });

    if (existingUser) {
      throw duplicateEmailError();
    }

    const existingSupplier = await tx.supplier.findFirst({
      where: {
        businessId: business.id,
        email: request.email,
      },
    });

    if (existingSupplier) {
      throw conflictError("A supplier with this email already exists for the selected business.");
    }

    const existingSupplierOrganization = await tx.supplierOrganization.findFirst({
      where: { email: request.email },
    });

    const supplierOrganization = existingSupplierOrganization
      ? await tx.supplierOrganization.update({
          where: { id: existingSupplierOrganization.id },
          data: {
            phone: existingSupplierOrganization.phone ?? request.phone,
            notes: (existingSupplierOrganization.notes ?? request.notes) || null,
          },
        })
      : await tx.supplierOrganization.create({
          data: {
            name: request.businessName,
            email: request.email,
            phone: request.phone,
            notes: request.notes || null,
          },
        });

    const supplier = await tx.supplier.create({
      data: {
        businessId: business.id,
        organizationId: supplierOrganization.id,
        name: request.businessName,
        contactName: request.fullName,
        email: request.email,
        phone: request.phone,
        notes: request.notes || null,
      },
    });

    const user = await tx.user.create({
      data: {
        businessId: business.id,
        supplierId: supplier.id,
        supplierOrganizationId: supplierOrganization.id,
        fullName: request.fullName,
        email: request.email,
        passwordHash: request.passwordHash,
        role: UserRole.supplier,
        status: UserStatus.active,
        notificationPreference: {
          create: {},
        },
      },
    });

    const reviewedRequest = await tx.supplierOnboardingRequest.update({
      where: { id: request.id },
      data: {
        status: "approved",
        reviewedByAdminId: adminUserId,
        reviewedAt: new Date(),
        approvedBusinessId: business.id,
        approvedSupplierId: supplier.id,
        approvedSupplierOrganizationId: supplierOrganization.id,
        approvedUserId: user.id,
        rejectionReason: null,
      },
    });

    await logAudit({
      tx,
      businessId: business.id,
      actorUserId: adminUserId,
      action: "supplier_access_request_approved",
      resourceType: "supplier_onboarding_request",
      resourceId: reviewedRequest.id,
      metadata: {
        supplierOrganizationId: supplierOrganization.id,
        supplierId: supplier.id,
        userId: user.id,
        email: user.email,
      },
    });

    return {
      request: reviewedRequest,
      supplierOrganization,
      supplier,
      user,
    };
  });

  if (env.DEMO_MODE !== "true") {
    try {
      await sendSupplierAccessApprovedEmail(approved.user.email);
    } catch {
      // Approval email delivery should not block the approval action.
    }
  }

  await sendVerificationForNewUser(approved.user.id, approved.user.email, approved.user.role);

  return approved;
}

export async function authenticateUser(input: unknown, ipAddress: string | null) {
  const values = signInSchema.parse(input);
  const email = values.email.toLowerCase();
  await assertLoginNotBlocked(email, ipAddress);

  const user = await db.user.findUnique({
    where: { email },
    include: { business: true },
  });

  if (!user || !user.passwordHash) {
    await registerFailedLogin(email, ipAddress);
    throw validationError("Invalid email or password.", {
      fieldErrors: {
        email: ["Invalid email or password."],
        password: ["Invalid email or password."],
      },
    });
  }

  if (user.status === UserStatus.invited) {
    throw conflictError(
      "Your account invitation is pending. Please accept the invite email to activate your account."
    );
  }

  const isValidPassword = await verifyPassword(values.password, user.passwordHash);
  if (!isValidPassword) {
    await registerFailedLogin(email, ipAddress);
    throw validationError("Invalid email or password.", {
      fieldErrors: {
        email: ["Invalid email or password."],
        password: ["Invalid email or password."],
      },
    });
  }

  await clearLoginFailures(email, ipAddress);
  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
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
      expiresAt: new Date(Date.now() + 1000 * 60 * 30),
    },
  });

  if (env.DEMO_MODE !== "true") {
    try {
      await sendPasswordResetEmail(email, rawToken, user.role);
    } catch (error) {
      await db.passwordResetToken.delete({
        where: { id: resetToken.id },
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
      ipAddress,
    });
  }

  return {
    ok: true,
    devToken: env.DEMO_MODE === "true" ? rawToken : null,
  };
}

export async function completePasswordReset(input: unknown) {
  const values = resetPasswordSchema.parse(input);
  const user = await db.user.findUnique({
    where: { email: values.email.toLowerCase() },
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
      expiresAt: { gt: new Date() },
    },
  });

  if (!resetToken) {
    throw validationError("Reset token is invalid or expired.", {
      fieldErrors: {
        token: ["Reset token is invalid or expired."],
      },
    });
  }

  const passwordHash = await hashPassword(values.password);
  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await tx.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });

    await tx.session.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (user.businessId) {
      await logAudit({
        tx,
        businessId: user.businessId,
        actorUserId: user.id,
        action: "password_reset",
        resourceType: "user",
        resourceId: user.id,
        metadata: {},
      });
    }
  });

  return { ok: true };
}

export async function inviteStaff(actorUserId: string, input: unknown, ipAddress: string | null) {
  const values = inviteStaffSchema.parse(input);
  const actor = await db.user.findUnique({
    where: { id: actorUserId },
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
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      throw validationError("A user with this email already exists.", {
        fieldErrors: {
          email: ["A user with this email already exists."],
        },
      });
    }

    await tx.staffInviteToken.updateMany({
      where: {
        businessId,
        email: normalizedEmail,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { revokedAt: new Date() },
    });

    const invite = await tx.staffInviteToken.create({
      data: {
        businessId,
        email: normalizedEmail,
        role: values.role,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        invitedByUserId: actorUserId,
      },
    });

    return invite;
  });

  if (env.DEMO_MODE !== "true") {
    try {
      await sendStaffInviteEmail(normalizedEmail, token);
    } catch (error) {
      await db.staffInviteToken.update({
        where: { id: invite.id },
        data: { revokedAt: new Date() },
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
    ipAddress,
  });

  return {
    invite,
    token: env.DEMO_MODE === "true" ? token : null,
  };
}

export async function acceptInvite(token: string, fullName: string, password: string) {
  const tokenHash = hashToken(token);
  const invite = await db.staffInviteToken.findFirst({
    where: {
      tokenHash,
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!invite) {
    throw validationError("Invite token is invalid or expired.", {
      fieldErrors: {
        token: ["Invite token is invalid or expired."],
      },
    });
  }

  const existingUser = await db.user.findUnique({
    where: { email: invite.email },
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
          create: {},
        },
      },
    });

    await tx.staffInviteToken.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });

    await logAudit({
      tx,
      businessId: invite.businessId,
      actorUserId: user.id,
      action: "invite_accepted",
      resourceType: "staff_invite",
      resourceId: invite.id,
      metadata: { email: invite.email },
    });

    return user;
  });
}

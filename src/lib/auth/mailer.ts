import type { UserRole } from "@prisma/client";

import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { getPortalForRole, getPortalOrigin } from "@/lib/portal";

const RESEND_API_URL = "https://api.resend.com/emails";
const EMAIL_SMOKE_TEST_TOKEN = "smoke-test-token";
const EMAIL_SMOKE_TEST_REASON = "Sample rejection reason for launch verification.";

export const EMAIL_SMOKE_TEST_TEMPLATES = [
  {
    value: "customer-verification",
    label: "Customer verification",
    description: "Preview or send the customer verification template and portal link.",
  },
  {
    value: "retail-password-reset",
    label: "Retail password reset",
    description: "Preview or send the retailer password reset template and portal link.",
  },
  {
    value: "retail-staff-invite",
    label: "Retail staff invite",
    description: "Preview or send the retail invite template for staff onboarding.",
  },
  {
    value: "supplier-approval",
    label: "Supplier approval",
    description: "Preview or send the supplier approval template and sign-in destination.",
  },
  {
    value: "supplier-rejection",
    label: "Supplier rejection",
    description: "Preview or send the supplier rejection template and re-request path.",
  },
] as const;

export type EmailSmokeTestTemplate = (typeof EMAIL_SMOKE_TEST_TEMPLATES)[number]["value"];

function buildUrl(pathname: string, searchParams: Record<string, string>, role: UserRole) {
  const url = new URL(pathname, getPortalOrigin(getPortalForRole(role), env.APP_URL));
  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

export function buildEmailVerificationLink(email: string, token: string, role: UserRole) {
  return buildUrl("/verify-email", { email, token }, role);
}

export function buildPasswordResetLink(email: string, token: string, role: UserRole) {
  return buildUrl("/reset-password", { email, token }, role);
}

export function buildStaffInviteLink(token: string) {
  const url = new URL("/accept-invite", getPortalOrigin("retail", env.APP_URL));
  url.searchParams.set("token", token);
  return url.toString();
}

function buildPortalLink(portal: "shop" | "retail" | "supply" | "admin", pathname: string) {
  return new URL(pathname, getPortalOrigin(portal, env.APP_URL)).toString();
}

async function sendEmail(message: { to: string; subject: string; html: string; text: string }) {
  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(env.MAIL_REPLY_TO ? { reply_to: env.MAIL_REPLY_TO } : {}),
    }),
  });

  if (response.ok) {
    return;
  }

  const payload = await response.json().catch(() => null);
  const detail =
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
      ? payload.message
      : "Unknown email delivery error.";

  throw new AppError(`Unable to send email right now. ${detail}`, {
    status: 503,
    code: "UNEXPECTED_ERROR",
  });
}

export async function sendTransactionalEmail(message: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  await sendEmail(message);
}

export async function sendPasswordResetEmail(email: string, token: string, role: UserRole) {
  const resetLink = buildPasswordResetLink(email, token, role);

  await sendEmail({
    to: email,
    subject: "Reset your Human Pulse password",
    html: `<p>You requested a password reset for Human Pulse.</p><p><a href="${resetLink}">Reset your password</a></p><p>If you did not request this, you can ignore this email.</p>`,
    text: `You requested a password reset for Human Pulse.\n\nReset your password: ${resetLink}\n\nIf you did not request this, you can ignore this email.`,
  });
}

export async function sendEmailVerificationEmail(email: string, token: string, role: UserRole) {
  const verifyLink = buildEmailVerificationLink(email, token, role);

  await sendEmail({
    to: email,
    subject: "Verify your Human Pulse email address",
    html: `<p>Welcome to Human Pulse. Please verify your email address to activate your account.</p><p><a href="${verifyLink}">Verify your email</a></p><p>This link will expire in 24 hours. If you did not create an account, you can ignore this email.</p>`,
    text: `Welcome to Human Pulse. Please verify your email address to activate your account.\n\nVerify your email: ${verifyLink}\n\nThis link will expire in 24 hours. If you did not create an account, you can ignore this email.`,
  });
}

export async function sendStaffInviteEmail(email: string, token: string) {
  const inviteLink = buildStaffInviteLink(token);

  await sendEmail({
    to: email,
    subject: "You have been invited to Human Pulse Retail",
    html: `<p>You have been invited to join a Human Pulse retail workspace.</p><p><a href="${inviteLink}">Accept your invite</a></p><p>The link opens the account activation form with your invite token prefilled.</p>`,
    text: `You have been invited to join a Human Pulse retail workspace.\n\nAccept your invite: ${inviteLink}\n\nThe link opens the account activation form with your invite token prefilled.`,
  });
}

export async function sendSupplierAccessApprovedEmail(email: string) {
  const signInLink = buildPortalLink("supply", "/sign-in");

  await sendEmail({
    to: email,
    subject: "Your Human Pulse supplier access has been approved",
    html: `<p>Your supplier portal request has been approved.</p><p>Check your inbox for the verification email that activates your account, then sign in here:</p><p><a href="${signInLink}">Open the supplier portal</a></p>`,
    text: `Your supplier portal request has been approved.\n\nCheck your inbox for the verification email that activates your account, then sign in here:\n${signInLink}`,
  });
}

export async function sendSupplierAccessRejectedEmail(email: string, reason: string) {
  const requestAccessLink = buildPortalLink("supply", "/sign-up");

  await sendEmail({
    to: email,
    subject: "Your Human Pulse supplier access request was reviewed",
    html: `<p>Your supplier portal request was not approved at this time.</p><p><strong>Review note:</strong> ${reason}</p><p>You can submit a new request when you are ready:</p><p><a href="${requestAccessLink}">Request supplier access</a></p>`,
    text: `Your supplier portal request was not approved at this time.\n\nReview note: ${reason}\n\nYou can submit a new request here:\n${requestAccessLink}`,
  });
}

export function buildEmailSmokeTestMessage(email: string, template: EmailSmokeTestTemplate) {
  switch (template) {
    case "customer-verification":
      return {
        to: email,
        subject: "Smoke Test: Customer email verification",
        html: `<p>This is a Human Pulse smoke test for the customer verification email.</p><p><a href="${buildEmailVerificationLink(email, EMAIL_SMOKE_TEST_TOKEN, "customer")}">Open customer verification link</a></p>`,
        text: `This is a Human Pulse smoke test for the customer verification email.\n\nOpen customer verification link: ${buildEmailVerificationLink(email, EMAIL_SMOKE_TEST_TOKEN, "customer")}`,
      };
    case "retail-password-reset":
      return {
        to: email,
        subject: "Smoke Test: Retail password reset",
        html: `<p>This is a Human Pulse smoke test for the retail password reset email.</p><p><a href="${buildPasswordResetLink(email, EMAIL_SMOKE_TEST_TOKEN, "owner")}">Open retail password reset link</a></p>`,
        text: `This is a Human Pulse smoke test for the retail password reset email.\n\nOpen retail password reset link: ${buildPasswordResetLink(email, EMAIL_SMOKE_TEST_TOKEN, "owner")}`,
      };
    case "retail-staff-invite":
      return {
        to: email,
        subject: "Smoke Test: Retail staff invite",
        html: `<p>This is a Human Pulse smoke test for the retail invite email.</p><p><a href="${buildStaffInviteLink(EMAIL_SMOKE_TEST_TOKEN)}">Open retail invite link</a></p>`,
        text: `This is a Human Pulse smoke test for the retail invite email.\n\nOpen retail invite link: ${buildStaffInviteLink(EMAIL_SMOKE_TEST_TOKEN)}`,
      };
    case "supplier-approval":
      return {
        to: email,
        subject: "Smoke Test: Supplier approval",
        html: `<p>This is a Human Pulse smoke test for the supplier approval email.</p><p><a href="${buildPortalLink("supply", "/sign-in")}">Open supplier sign-in</a></p>`,
        text: `This is a Human Pulse smoke test for the supplier approval email.\n\nOpen supplier sign-in: ${buildPortalLink("supply", "/sign-in")}`,
      };
    case "supplier-rejection":
      return {
        to: email,
        subject: "Smoke Test: Supplier rejection",
        html: `<p>This is a Human Pulse smoke test for the supplier rejection email.</p><p><strong>Review note:</strong> ${EMAIL_SMOKE_TEST_REASON}</p><p><a href="${buildPortalLink("supply", "/sign-up")}">Open supplier request access</a></p>`,
        text: `This is a Human Pulse smoke test for the supplier rejection email.\n\nReview note: ${EMAIL_SMOKE_TEST_REASON}\n\nOpen supplier request access: ${buildPortalLink("supply", "/sign-up")}`,
      };
    default: {
      const exhaustiveCheck: never = template;
      return exhaustiveCheck;
    }
  }
}

export async function sendEmailSmokeTest(email: string, template: EmailSmokeTestTemplate) {
  await sendTransactionalEmail(buildEmailSmokeTestMessage(email, template));
}

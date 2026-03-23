import type { UserRole } from "@prisma/client";

import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { getPortalForRole, getPortalOrigin } from "@/lib/portal";

const RESEND_API_URL = "https://api.resend.com/emails";

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

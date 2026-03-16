import { AppError } from "@/lib/errors";
import { env } from "@/lib/env";

const RESEND_API_URL = "https://api.resend.com/emails";

function buildUrl(pathname: string, searchParams: Record<string, string>) {
  const url = new URL(pathname, env.APP_URL);
  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

export function buildPasswordResetLink(email: string, token: string) {
  return buildUrl("/reset-password", { email, token });
}

export function buildStaffInviteLink(token: string) {
  return buildUrl("/accept-invite", { token });
}

async function sendEmail(message: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(env.MAIL_REPLY_TO ? { reply_to: env.MAIL_REPLY_TO } : {})
    })
  });

  if (response.ok) {
    return;
  }

  const payload = await response.json().catch(() => null);
  const detail =
    payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
      ? payload.message
      : "Unknown email delivery error.";

  throw new AppError(`Unable to send email right now. ${detail}`, {
    status: 503,
    code: "UNEXPECTED_ERROR"
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

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetLink = buildPasswordResetLink(email, token);

  await sendEmail({
    to: email,
    subject: "Reset your Business Management App password",
    html: `<p>You requested a password reset for Business Management App.</p><p><a href="${resetLink}">Reset your password</a></p><p>If you did not request this, you can ignore this email.</p>`,
    text: `You requested a password reset for Business Management App.\n\nReset your password: ${resetLink}\n\nIf you did not request this, you can ignore this email.`
  });
}

export async function sendStaffInviteEmail(email: string, token: string) {
  const inviteLink = buildStaffInviteLink(token);

  await sendEmail({
    to: email,
    subject: "You have been invited to Business Management App",
    html: `<p>You have been invited to join a business in Business Management App.</p><p><a href="${inviteLink}">Accept your invite</a></p><p>The link opens the account activation form with your invite token prefilled.</p>`,
    text: `You have been invited to join a business in Business Management App.\n\nAccept your invite: ${inviteLink}\n\nThe link opens the account activation form with your invite token prefilled.`
  });
}

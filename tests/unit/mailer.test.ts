import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildEmailSmokeTestMessage,
  buildPasswordResetLink,
  buildStaffInviteLink,
  sendPasswordResetEmail,
} from "@/lib/auth/mailer";

describe("auth mailer", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.APP_URL = "https://app.example.com";
    process.env.RESEND_API_KEY = "resend_test_key";
    process.env.MAIL_FROM = "Business Management App <noreply@example.com>";
    process.env.MAIL_REPLY_TO = "help@example.com";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  it("builds a password reset link for the correct role portal", () => {
    expect(buildPasswordResetLink("owner@example.com", "token-123", "owner")).toBe(
      "https://retail.app.example.com/reset-password?email=owner%40example.com&token=token-123"
    );
  });

  it("builds an invite link for the retail portal", () => {
    expect(buildStaffInviteLink("invite-token")).toBe(
      "https://retail.app.example.com/accept-invite?token=invite-token"
    );
  });

  it("sends reset emails through Resend", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
    });
    vi.stubGlobal("fetch", fetchMock);

    await sendPasswordResetEmail("owner@example.com", "token-123", "owner");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer resend_test_key",
        }),
      })
    );

    const request = fetchMock.mock.calls[0]?.[1];
    expect(request).toBeDefined();
    const body = JSON.parse(String(request?.body));
    expect(body.from).toBe("Business Management App <noreply@example.com>");
    expect(body.to).toEqual(["owner@example.com"]);
    expect(body.reply_to).toBe("help@example.com");
    expect(body.html).toContain(
      "https://retail.app.example.com/reset-password?email=owner%40example.com&token=token-123"
    );
  });

  it("builds supplier rejection smoke test content with the supply portal link", () => {
    const message = buildEmailSmokeTestMessage("supplier@example.com", "supplier-rejection");

    expect(message.subject).toBe("Smoke Test: Supplier rejection");
    expect(message.html).toContain("Sample rejection reason for launch verification.");
    expect(message.html).toContain("https://supply.app.example.com/sign-up");
    expect(message.text).toContain("https://supply.app.example.com/sign-up");
  });
});

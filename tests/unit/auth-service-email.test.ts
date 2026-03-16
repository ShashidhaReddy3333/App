import { beforeEach, describe, expect, it, vi } from "vitest";

const dbState = vi.hoisted(() => {
  const passwordResetCreate = vi.fn();
  const passwordResetDelete = vi.fn();
  const passwordResetCount = vi.fn();
  const userFindUnique = vi.fn();
  const txUserFindUnique = vi.fn();
  const txStaffInviteUpdateMany = vi.fn();
  const txStaffInviteCreate = vi.fn();
  const staffInviteCount = vi.fn();
  const staffInviteUpdate = vi.fn();
  const transaction = vi.fn(async (callback: (tx: unknown) => unknown) =>
    callback({
      user: {
        findUnique: txUserFindUnique
      },
      staffInviteToken: {
        updateMany: txStaffInviteUpdateMany,
        create: txStaffInviteCreate
      }
    })
  );

  return {
    passwordResetCreate,
    passwordResetDelete,
    passwordResetCount,
    userFindUnique,
    txUserFindUnique,
    txStaffInviteUpdateMany,
    txStaffInviteCreate,
    staffInviteCount,
    staffInviteUpdate,
    transaction
  };
});

const mailerState = vi.hoisted(() => ({
  sendPasswordResetEmail: vi.fn(),
  sendStaffInviteEmail: vi.fn()
}));

const auditState = vi.hoisted(() => ({
  logAudit: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: dbState.userFindUnique
    },
    passwordResetToken: {
      create: dbState.passwordResetCreate,
      delete: dbState.passwordResetDelete,
      count: dbState.passwordResetCount
    },
    staffInviteToken: {
      update: dbState.staffInviteUpdate,
      count: dbState.staffInviteCount
    },
    $transaction: dbState.transaction
  }
}));

vi.mock("@/lib/auth/mailer", () => ({
  sendPasswordResetEmail: mailerState.sendPasswordResetEmail,
  sendStaffInviteEmail: mailerState.sendStaffInviteEmail
}));

vi.mock("@/lib/audit", () => ({
  logAudit: auditState.logAudit
}));

vi.mock("@/lib/auth/token", () => ({
  createOpaqueToken: vi.fn(() => "opaque-token"),
  hashToken: vi.fn((value: string) => `hash:${value}`)
}));

describe("auth service email delivery", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.DEMO_MODE = "false";
  });

  it("sends password reset email in non-demo mode and hides the raw token", async () => {
    dbState.userFindUnique.mockResolvedValueOnce({ id: "user_1", businessId: "biz_1" });
    dbState.passwordResetCount.mockResolvedValueOnce(0);
    dbState.passwordResetCreate.mockResolvedValueOnce({ id: "prt_1" });
    mailerState.sendPasswordResetEmail.mockResolvedValueOnce(undefined);

    const { beginPasswordReset } = await import("@/lib/services/auth-service");
    const result = await beginPasswordReset({ email: "owner@example.com" }, null);

    expect(result).toEqual({ ok: true, devToken: null });
    expect(mailerState.sendPasswordResetEmail).toHaveBeenCalledWith("owner@example.com", "opaque-token");
    expect(dbState.passwordResetDelete).not.toHaveBeenCalled();
  });

  it("returns a demo reset token instead of sending email in demo mode", async () => {
    process.env.DEMO_MODE = "true";
    dbState.userFindUnique.mockResolvedValueOnce({ id: "user_1", businessId: "biz_1" });
    dbState.passwordResetCount.mockResolvedValueOnce(0);
    dbState.passwordResetCreate.mockResolvedValueOnce({ id: "prt_1" });

    const { beginPasswordReset } = await import("@/lib/services/auth-service");
    const result = await beginPasswordReset({ email: "owner@example.com" }, null);

    expect(result).toEqual({ ok: true, devToken: "opaque-token" });
    expect(mailerState.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("cleans up a password reset token if email delivery fails", async () => {
    dbState.userFindUnique.mockResolvedValueOnce({ id: "user_1", businessId: "biz_1" });
    dbState.passwordResetCount.mockResolvedValueOnce(0);
    dbState.passwordResetCreate.mockResolvedValueOnce({ id: "prt_1" });
    mailerState.sendPasswordResetEmail.mockRejectedValueOnce(new Error("send failed"));

    const { beginPasswordReset } = await import("@/lib/services/auth-service");

    await expect(beginPasswordReset({ email: "owner@example.com" }, null)).rejects.toThrow("send failed");
    expect(dbState.passwordResetDelete).toHaveBeenCalledWith({
      where: { id: "prt_1" }
    });
  });

  it("sends staff invite email in non-demo mode and revokes failed invites", async () => {
    dbState.userFindUnique.mockResolvedValueOnce({ id: "owner_1", businessId: "biz_1" });
    dbState.staffInviteCount.mockResolvedValueOnce(0);
    dbState.txUserFindUnique.mockResolvedValueOnce(null);
    dbState.txStaffInviteUpdateMany.mockResolvedValueOnce({ count: 0 });
    dbState.txStaffInviteCreate.mockResolvedValueOnce({ id: "inv_1" });
    mailerState.sendStaffInviteEmail.mockResolvedValueOnce(undefined);

    const { inviteStaff } = await import("@/lib/services/auth-service");
    const result = await inviteStaff("owner_1", { email: "cashier@example.com", role: "cashier" }, null);

    expect(result).toEqual({
      invite: { id: "inv_1" },
      token: null
    });
    expect(mailerState.sendStaffInviteEmail).toHaveBeenCalledWith("cashier@example.com", "opaque-token");
    expect(dbState.staffInviteUpdate).not.toHaveBeenCalled();
  });

  it("returns a demo invite token instead of sending email in demo mode", async () => {
    process.env.DEMO_MODE = "true";
    dbState.userFindUnique.mockResolvedValueOnce({ id: "owner_1", businessId: "biz_1" });
    dbState.staffInviteCount.mockResolvedValueOnce(0);
    dbState.txUserFindUnique.mockResolvedValueOnce(null);
    dbState.txStaffInviteUpdateMany.mockResolvedValueOnce({ count: 0 });
    dbState.txStaffInviteCreate.mockResolvedValueOnce({ id: "inv_1" });

    const { inviteStaff } = await import("@/lib/services/auth-service");
    const result = await inviteStaff("owner_1", { email: "cashier@example.com", role: "cashier" }, null);

    expect(result).toEqual({
      invite: { id: "inv_1" },
      token: "opaque-token"
    });
    expect(mailerState.sendStaffInviteEmail).not.toHaveBeenCalled();
  });

  it("revokes a pending invite when email delivery fails", async () => {
    dbState.userFindUnique.mockResolvedValueOnce({ id: "owner_1", businessId: "biz_1" });
    dbState.staffInviteCount.mockResolvedValueOnce(0);
    dbState.txUserFindUnique.mockResolvedValueOnce(null);
    dbState.txStaffInviteUpdateMany.mockResolvedValueOnce({ count: 0 });
    dbState.txStaffInviteCreate.mockResolvedValueOnce({ id: "inv_1" });
    mailerState.sendStaffInviteEmail.mockRejectedValueOnce(new Error("send failed"));

    const { inviteStaff } = await import("@/lib/services/auth-service");

    await expect(inviteStaff("owner_1", { email: "cashier@example.com", role: "cashier" }, null)).rejects.toThrow("send failed");
    expect(dbState.staffInviteUpdate).toHaveBeenCalledWith({
      where: { id: "inv_1" },
      data: { revokedAt: expect.any(Date) }
    });
  });
});

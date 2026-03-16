import { describe, expect, it } from "vitest";

import { toPendingInviteCards, toSupplierOptions } from "@/lib/view-models/app";

describe("view-model helpers", () => {
  it("maps supplier options to human-readable labels", () => {
    const options = toSupplierOptions([
      {
        id: "sup_1",
        name: "North Foods Wholesale",
        businessId: "biz_1",
        contactName: null,
        email: null,
        phone: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ] as never);

    expect(options).toEqual([
      {
        id: "sup_1",
        name: "North Foods Wholesale",
        label: "North Foods Wholesale"
      }
    ]);
  });

  it("formats pending invites with status and timestamps", () => {
    const invites = toPendingInviteCards([
      {
        id: "invite_1",
        businessId: "biz_1",
        email: "new.staff@example.com",
        role: "manager",
        tokenHash: "hash",
        expiresAt: new Date("2026-03-20T12:00:00.000Z"),
        acceptedAt: null,
        revokedAt: null,
        invitedByUserId: "usr_1",
        createdAt: new Date("2026-03-15T12:00:00.000Z")
      }
    ] as never);

    expect(invites[0]).toMatchObject({
      email: "new.staff@example.com",
      roleLabel: "manager",
      statusLabel: "pending"
    });
    expect(invites[0]?.createdAtLabel).toBeTruthy();
    expect(invites[0]?.expiresAtLabel).toBeTruthy();
  });
});

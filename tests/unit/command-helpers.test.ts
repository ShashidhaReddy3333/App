import { describe, expect, it } from "vitest";

import { AppError } from "@/lib/errors";
import { getOwnedLocation, reserveInventory } from "@/lib/services/command-helpers";

describe("command helpers", () => {
  it("rejects cross-business location access", async () => {
    const tx = {
      location: {
        findFirst: async () => null
      }
    } as never;

    await expect(getOwnedLocation(tx, "biz_1", "loc_other")).rejects.toMatchObject({
      message: "Location not found for this business.",
      code: "NOT_FOUND"
    } satisfies Partial<AppError>);
  });

  it("raises a stale inventory conflict when optimistic reserve loses the race", async () => {
    const tx = {
      inventoryBalance: {
        findUniqueOrThrow: async () => ({
          productId: "prd_1",
          locationId: "loc_1",
          onHandQuantity: 1,
          reservedQuantity: 0,
          availableQuantity: 1,
          versionNumber: 2
        }),
        updateMany: async () => ({ count: 0 })
      },
      inventoryMovement: {
        create: async () => ({ id: "mov_1" })
      }
    } as never;

    await expect(
      reserveInventory(tx, {
        productId: "prd_1",
        locationId: "loc_1",
        quantity: 1,
        allowOversell: false,
        referenceId: "sale_1",
        createdById: "usr_1"
      })
    ).rejects.toMatchObject({
      message: "Inventory changed while reserving this cart. Please review item availability before continuing.",
      code: "STALE_INVENTORY"
    } satisfies Partial<AppError>);
  });
});

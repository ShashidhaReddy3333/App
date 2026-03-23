import { describe, expect, it } from "vitest";
import { z } from "zod";

import { apiError, apiSuccess } from "@/lib/http";

describe("api response helpers", () => {
  it("wraps success payloads in the standard envelope", async () => {
    const response = apiSuccess({ saleId: "sale_123" }, { status: 201, message: "Created." });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      data: { saleId: "sale_123" },
      message: "Created.",
    });
  });

  it("shapes zod validation failures consistently", async () => {
    const schema = z.object({
      email: z.string().email(),
    });

    const response = (() => {
      try {
        schema.parse({ email: "not-an-email" });
        throw new Error("Expected schema parsing to fail.");
      } catch (error) {
        return apiError(error);
      }
    })();
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.message).toBe("Validation failed.");
    expect(payload.code).toBe("VALIDATION_ERROR");
    expect(payload.issues.fieldErrors.email).toBeTruthy();
  });

  it("maps unexpected errors to a 500 envelope", async () => {
    const response = apiError(new Error("Unexpected failure"));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.message).toBe("An unexpected error occurred.");
    expect(payload.code).toBe("UNEXPECTED_ERROR");
  });
});

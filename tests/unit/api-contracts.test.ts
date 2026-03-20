import { describe, expect, it, vi } from "vitest";

vi.mock("@prisma/client", () => ({
  Prisma: {
    PrismaClientInitializationError: class PrismaClientInitializationError extends Error {},
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
      code: string;
      constructor(message: string, opts: { code: string; clientVersion: string }) {
        super(message);
        this.code = opts.code;
      }
    },
  },
}));

import {
  AppError,
  unauthorizedError,
  forbiddenError,
  notFoundError,
  conflictError,
  validationError,
  toAppError,
} from "@/lib/errors";

describe("error factory functions", () => {
  it("unauthorizedError returns 401 with UNAUTHORIZED code", () => {
    const err = unauthorizedError();
    expect(err).toBeInstanceOf(AppError);
    expect(err.status).toBe(401);
    expect(err.code).toBe("UNAUTHORIZED");
    expect(err.message).toBe("You need to sign in to continue.");
  });

  it("unauthorizedError accepts a custom message", () => {
    const err = unauthorizedError("Session expired.");
    expect(err.message).toBe("Session expired.");
    expect(err.status).toBe(401);
  });

  it("forbiddenError returns 403 with FORBIDDEN code", () => {
    const err = forbiddenError();
    expect(err).toBeInstanceOf(AppError);
    expect(err.status).toBe(403);
    expect(err.code).toBe("FORBIDDEN");
    expect(err.message).toBe("You do not have permission to access this area.");
  });

  it("notFoundError returns 404 with NOT_FOUND code", () => {
    const err = notFoundError();
    expect(err).toBeInstanceOf(AppError);
    expect(err.status).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.message).toBe("The requested resource was not found.");
  });

  it("notFoundError accepts a custom message", () => {
    const err = notFoundError("Product not found.");
    expect(err.message).toBe("Product not found.");
  });

  it("conflictError returns 409 with CONFLICT code by default", () => {
    const err = conflictError("Duplicate entry.");
    expect(err).toBeInstanceOf(AppError);
    expect(err.status).toBe(409);
    expect(err.code).toBe("CONFLICT");
    expect(err.message).toBe("Duplicate entry.");
  });

  it("conflictError accepts a custom error code", () => {
    const err = conflictError("Already reserved.", "IDEMPOTENCY_CONFLICT");
    expect(err.code).toBe("IDEMPOTENCY_CONFLICT");
    expect(err.status).toBe(409);
  });

  it("validationError returns 400 with VALIDATION_ERROR code", () => {
    const issues = { fieldErrors: { email: ["Invalid email"] } };
    const err = validationError("Bad input.", issues);
    expect(err).toBeInstanceOf(AppError);
    expect(err.status).toBe(400);
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.message).toBe("Bad input.");
    expect(err.issues).toEqual(issues);
  });

  it("validationError works without issues argument", () => {
    const err = validationError("Missing fields.");
    expect(err.status).toBe(400);
    expect(err.issues).toBeUndefined();
  });
});

describe("toAppError conversion", () => {
  it("passes through an existing AppError unchanged", () => {
    const original = notFoundError("Gone.");
    const converted = toAppError(original);
    expect(converted).toBe(original);
  });

  it("converts a plain Error to a 500 UNEXPECTED_ERROR", () => {
    const converted = toAppError(new Error("Something broke"));
    expect(converted.status).toBe(500);
    expect(converted.code).toBe("UNEXPECTED_ERROR");
    expect(converted.message).toBe("Something broke");
  });

  it("converts an unknown value to a 500 UNEXPECTED_ERROR", () => {
    const converted = toAppError("string error");
    expect(converted.status).toBe(500);
    expect(converted.code).toBe("UNEXPECTED_ERROR");
  });
});

describe("AppError default values", () => {
  it("defaults to status 400 and UNEXPECTED_ERROR code", () => {
    const err = new AppError("test");
    expect(err.status).toBe(400);
    expect(err.code).toBe("UNEXPECTED_ERROR");
  });
});

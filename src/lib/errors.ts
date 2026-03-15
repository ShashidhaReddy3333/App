import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "RESERVATION_EXPIRED"
  | "STALE_INVENTORY"
  | "IDEMPOTENCY_CONFLICT"
  | "DATABASE_UNAVAILABLE"
  | "UNEXPECTED_ERROR";

export class AppError extends Error {
  status: number;
  code: ErrorCode;
  issues?: Record<string, unknown>;

  constructor(message: string, options?: { status?: number; code?: ErrorCode; issues?: Record<string, unknown> }) {
    super(message);
    this.name = "AppError";
    this.status = options?.status ?? 400;
    this.code = options?.code ?? "UNEXPECTED_ERROR";
    this.issues = options?.issues;
  }
}

export function unauthorizedError(message = "You need to sign in to continue.") {
  return new AppError(message, { status: 401, code: "UNAUTHORIZED" });
}

export function forbiddenError(message = "You do not have permission to access this area.") {
  return new AppError(message, { status: 403, code: "FORBIDDEN" });
}

export function notFoundError(message = "The requested resource was not found.") {
  return new AppError(message, { status: 404, code: "NOT_FOUND" });
}

export function conflictError(message: string, code: ErrorCode = "CONFLICT") {
  return new AppError(message, { status: 409, code });
}

export function validationError(message: string, issues?: Record<string, unknown>) {
  return new AppError(message, { status: 400, code: "VALIDATION_ERROR", issues });
}

export function toAppError(error: unknown) {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof ZodError) {
    return validationError("Validation failed.", error.flatten() as Record<string, unknown>);
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new AppError("Database is unavailable. Check DATABASE_URL and ensure PostgreSQL is running.", {
      status: 503,
      code: "DATABASE_UNAVAILABLE"
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return notFoundError();
  }

  if (error instanceof Error) {
    return new AppError(error.message || "Unexpected error.", { status: 500, code: "UNEXPECTED_ERROR" });
  }

  return new AppError("Unexpected error.", { status: 500, code: "UNEXPECTED_ERROR" });
}

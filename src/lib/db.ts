// ---------------------------------------------------------------------------
// Row Level Security (RLS) — defense-in-depth for multi-tenant isolation
// ---------------------------------------------------------------------------
// Migration 0005_row_level_security enables RLS on every business-scoped table
// (User, StaffInviteToken, Location, TaxRate, Supplier, Product, Cart, Order,
//  POSRegister, Sale, Refund, PurchaseOrder, AuditLog, IdempotencyKey).
//
// Current state:
//   Prisma connects as the database **owner** role, which bypasses RLS by default.
//   Application-level WHERE clauses on businessId remain the primary isolation mechanism.
//
// To fully enforce RLS in the future:
//   1. Create a login role that inherits from 'app_user' (already provisioned in the migration).
//   2. Update DATABASE_URL to connect as that login role instead of the owner.
//   3. At the start of every request/transaction, execute:
//        SET LOCAL app.business_id = '<businessId>';
//      This scopes all subsequent queries to a single tenant.
//   4. FORCE ROW LEVEL SECURITY is set on all tables, so even table owners
//      will be subject to the policies when connecting as app_user.
// ---------------------------------------------------------------------------
import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

// ---------------------------------------------------------------------------
// Serializable transaction retry wrapper
// ---------------------------------------------------------------------------
// PostgreSQL can throw serialization failure errors (SQLSTATE 40001) when
// Serializable isolation detects a conflict. These are expected under
// concurrency and should be retried.
// ---------------------------------------------------------------------------

function isSerializationError(error: unknown): boolean {
  // Prisma wraps DB errors — check for PrismaClientKnownRequestError with
  // the PostgreSQL serialization_failure code.
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2034 = "Transaction failed due to a write conflict or a deadlock"
    return error.code === "P2034";
  }
  // Fallback: check for raw PostgreSQL SQLSTATE 40001
  if (error instanceof Error && "code" in error) {
    return (error as { code: string }).code === "40001";
  }
  return false;
}

/**
 * Wraps a Prisma Serializable transaction with automatic retry on
 * serialization failures. Retries up to `maxRetries` times with
 * randomized backoff to avoid thundering herd.
 */
export async function withSerializableRetry<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await db.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (isSerializationError(error) && attempt < maxRetries) {
        // Randomized backoff: 50-150ms * attempt multiplier
        const delay = Math.floor(Math.random() * 100 + 50) * (attempt + 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error("withSerializableRetry: unreachable");
}

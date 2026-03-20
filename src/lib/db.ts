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
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

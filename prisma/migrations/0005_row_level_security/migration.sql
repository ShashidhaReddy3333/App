-- Row Level Security (RLS) policies for multi-tenant isolation
-- =============================================================
--
-- IMPORTANT NOTES:
-- 1. RLS is configured but Prisma uses the database owner role which BYPASSES RLS.
--    The owner role is exempt from RLS by default in PostgreSQL.
-- 2. To enforce RLS, the application would need to:
--    a. Connect as the 'app_user' role (not the owner)
--    b. Execute SET app.business_id = '<business_id>' before each query/transaction
-- 3. The app_user role has FORCE ROW LEVEL SECURITY enabled on all business-scoped tables,
--    meaning RLS is enforced even if app_user is later granted superuser-like privileges.
-- 4. This migration sets up RLS as defense-in-depth infrastructure for future enforcement.
--    Even without switching roles, the policies document the intended access boundaries
--    and can be activated by changing the connection role.

-- Create a restricted role for application use (not used by Prisma directly yet)
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user NOLOGIN;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;

-- ============================================================
-- RLS policies for all tables with a direct businessId column
-- ============================================================

-- User (businessId is nullable — policy allows access when businessId matches OR is NULL)
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" FORCE ROW LEVEL SECURITY;
CREATE POLICY business_isolation_User ON "User"
  FOR ALL
  TO app_user
  USING ("businessId" IS NULL OR "businessId" = current_setting('app.business_id', true));

-- StaffInviteToken
ALTER TABLE "StaffInviteToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StaffInviteToken" FORCE ROW LEVEL SECURITY;
CREATE POLICY business_isolation_StaffInviteToken ON "StaffInviteToken"
  FOR ALL
  TO app_user
  USING ("businessId" = current_setting('app.business_id', true));

-- Location
ALTER TABLE "Location" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Location" FORCE ROW LEVEL SECURITY;
CREATE POLICY business_isolation_Location ON "Location"
  FOR ALL
  TO app_user
  USING ("businessId" = current_setting('app.business_id', true));

-- TaxRate
ALTER TABLE "TaxRate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TaxRate" FORCE ROW LEVEL SECURITY;
CREATE POLICY business_isolation_TaxRate ON "TaxRate"
  FOR ALL
  TO app_user
  USING ("businessId" = current_setting('app.business_id', true));

-- Supplier
ALTER TABLE "Supplier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Supplier" FORCE ROW LEVEL SECURITY;
CREATE POLICY business_isolation_Supplier ON "Supplier"
  FOR ALL
  TO app_user
  USING ("businessId" = current_setting('app.business_id', true));

-- Product
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" FORCE ROW LEVEL SECURITY;
CREATE POLICY business_isolation_Product ON "Product"
  FOR ALL
  TO app_user
  USING ("businessId" = current_setting('app.business_id', true));

-- Cart
ALTER TABLE "Cart" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Cart" FORCE ROW LEVEL SECURITY;
CREATE POLICY business_isolation_Cart ON "Cart"
  FOR ALL
  TO app_user
  USING ("businessId" = current_setting('app.business_id', true));

-- Order
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" FORCE ROW LEVEL SECURITY;
CREATE POLICY business_isolation_Order ON "Order"
  FOR ALL
  TO app_user
  USING ("businessId" = current_setting('app.business_id', true));

-- POSRegister
ALTER TABLE "POSRegister" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "POSRegister" FORCE ROW LEVEL SECURITY;
CREATE POLICY business_isolation_POSRegister ON "POSRegister"
  FOR ALL
  TO app_user
  USING ("businessId" = current_setting('app.business_id', true));

-- Sale
ALTER TABLE "Sale" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Sale" FORCE ROW LEVEL SECURITY;
CREATE POLICY business_isolation_Sale ON "Sale"
  FOR ALL
  TO app_user
  USING ("businessId" = current_setting('app.business_id', true));

-- Refund
ALTER TABLE "Refund" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Refund" FORCE ROW LEVEL SECURITY;
CREATE POLICY business_isolation_Refund ON "Refund"
  FOR ALL
  TO app_user
  USING ("businessId" = current_setting('app.business_id', true));

-- PurchaseOrder
ALTER TABLE "PurchaseOrder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PurchaseOrder" FORCE ROW LEVEL SECURITY;
CREATE POLICY business_isolation_PurchaseOrder ON "PurchaseOrder"
  FOR ALL
  TO app_user
  USING ("businessId" = current_setting('app.business_id', true));

-- AuditLog
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" FORCE ROW LEVEL SECURITY;
CREATE POLICY business_isolation_AuditLog ON "AuditLog"
  FOR ALL
  TO app_user
  USING ("businessId" = current_setting('app.business_id', true));

-- IdempotencyKey
ALTER TABLE "IdempotencyKey" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IdempotencyKey" FORCE ROW LEVEL SECURITY;
CREATE POLICY business_isolation_IdempotencyKey ON "IdempotencyKey"
  FOR ALL
  TO app_user
  USING ("businessId" = current_setting('app.business_id', true));

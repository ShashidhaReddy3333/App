ALTER TYPE "PurchaseOrderStatus" ADD VALUE IF NOT EXISTS 'shipped';

ALTER TYPE "FulfillmentStatus" ADD VALUE IF NOT EXISTS 'cancelled';

ALTER TABLE "PurchaseOrder"
  ADD COLUMN IF NOT EXISTS "trackingNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "shippedAt" TIMESTAMP(3);

ALTER TABLE "Sale"
  ADD COLUMN IF NOT EXISTS "customerId" TEXT,
  ADD COLUMN IF NOT EXISTS "loyaltyPointsRedeemed" INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'LoyaltyTransaction'
  ) THEN
    CREATE TABLE "LoyaltyTransaction" (
      "id" TEXT NOT NULL,
      "customerProfileId" TEXT NOT NULL,
      "saleId" TEXT,
      "pointsDelta" INTEGER NOT NULL,
      "amountDelta" DECIMAL(12,2) NOT NULL,
      "note" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "LoyaltyTransaction_pkey" PRIMARY KEY ("id")
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Sale_customerId_fkey'
  ) THEN
    ALTER TABLE "Sale"
      ADD CONSTRAINT "Sale_customerId_fkey"
      FOREIGN KEY ("customerId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'LoyaltyTransaction_customerProfileId_fkey'
  ) THEN
    ALTER TABLE "LoyaltyTransaction"
      ADD CONSTRAINT "LoyaltyTransaction_customerProfileId_fkey"
      FOREIGN KEY ("customerProfileId") REFERENCES "CustomerProfile"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'LoyaltyTransaction_saleId_fkey'
  ) THEN
    ALTER TABLE "LoyaltyTransaction"
      ADD CONSTRAINT "LoyaltyTransaction_saleId_fkey"
      FOREIGN KEY ("saleId") REFERENCES "Sale"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Sale_customerId_createdAt_idx"
  ON "Sale"("customerId", "createdAt");

CREATE INDEX IF NOT EXISTS "LoyaltyTransaction_customerProfileId_createdAt_idx"
  ON "LoyaltyTransaction"("customerProfileId", "createdAt");

CREATE INDEX IF NOT EXISTS "LoyaltyTransaction_saleId_idx"
  ON "LoyaltyTransaction"("saleId");

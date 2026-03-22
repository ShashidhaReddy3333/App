CREATE INDEX IF NOT EXISTS "Product_businessId_barcode_idx"
  ON "Product"("businessId", "barcode");

CREATE INDEX IF NOT EXISTS "PlatformDispute_businessId_idx"
  ON "PlatformDispute"("businessId");

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'EmailVerificationToken'
  ) THEN
    DROP INDEX IF EXISTS "EmailVerificationToken_tokenHash_idx";

    IF NOT EXISTS (
      SELECT 1
      FROM pg_indexes
      WHERE schemaname = 'public' AND indexname = 'EmailVerificationToken_tokenHash_key'
    ) THEN
      EXECUTE 'CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash")';
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Order'
      AND column_name = 'paymentStatus'
      AND udt_name = 'text'
  ) THEN
    ALTER TABLE "Order"
      ALTER COLUMN "paymentStatus" TYPE "PaymentStatus"
      USING (
        CASE
          WHEN "paymentStatus" = 'paid' THEN 'settled'::"PaymentStatus"
          WHEN "paymentStatus" IN ('pending', 'authorized', 'captured', 'settled', 'failed', 'voided', 'refunded_partial', 'refunded_full')
            THEN "paymentStatus"::"PaymentStatus"
          ELSE 'pending'::"PaymentStatus"
        END
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'PlatformDisputeEvent'
  ) THEN
    CREATE TABLE "PlatformDisputeEvent" (
      "id" TEXT NOT NULL,
      "disputeId" TEXT NOT NULL,
      "authorUserId" TEXT,
      "eventType" TEXT NOT NULL DEFAULT 'note',
      "visibility" TEXT NOT NULL DEFAULT 'internal',
      "body" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PlatformDisputeEvent_pkey" PRIMARY KEY ("id")
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'PlatformDisputeEvent_disputeId_fkey'
  ) THEN
    ALTER TABLE "PlatformDisputeEvent"
      ADD CONSTRAINT "PlatformDisputeEvent_disputeId_fkey"
      FOREIGN KEY ("disputeId") REFERENCES "PlatformDispute"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'PlatformDisputeEvent_authorUserId_fkey'
  ) THEN
    ALTER TABLE "PlatformDisputeEvent"
      ADD CONSTRAINT "PlatformDisputeEvent_authorUserId_fkey"
      FOREIGN KEY ("authorUserId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "PlatformDisputeEvent_disputeId_createdAt_idx"
  ON "PlatformDisputeEvent"("disputeId", "createdAt");

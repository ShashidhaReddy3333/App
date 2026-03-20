-- Phase 2: Multi-Retailer Marketplace, Platform Admin, Stripe Integration,
--           Object Storage, and Job Queue

-- ============================================================
-- ALTER existing tables
-- ============================================================

-- Business: add marketplace visibility & custom commission rate
ALTER TABLE "Business"
  ADD COLUMN IF NOT EXISTS "isMarketplaceVisible"       BOOLEAN         NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "marketplaceCommissionRate"  DECIMAL(5,4);

-- Order: add Stripe checkout session ID
ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "stripeCheckoutSessionId"    TEXT;

-- Payment: add Stripe payment-intent ID
ALTER TABLE "Payment"
  ADD COLUMN IF NOT EXISTS "stripePaymentIntentId"      TEXT;

-- OrderPayment: add Stripe payment-intent ID
ALTER TABLE "OrderPayment"
  ADD COLUMN IF NOT EXISTS "stripePaymentIntentId"      TEXT;

-- ============================================================
-- Multi-Retailer Marketplace
-- ============================================================

CREATE TABLE IF NOT EXISTS "MarketplaceConfig" (
  "id"                TEXT          NOT NULL PRIMARY KEY,
  "marketplaceName"   TEXT          NOT NULL DEFAULT 'Human Pulse Marketplace',
  "logoUrl"           TEXT,
  "defaultCommissionRate" DECIMAL(5,4) NOT NULL DEFAULT 0.1000,
  "isActive"          BOOLEAN       NOT NULL DEFAULT true,
  "supportEmail"      TEXT,
  "termsUrl"          TEXT,
  "privacyUrl"        TEXT,
  "metaDescription"   TEXT,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "BusinessCategory" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "name"        TEXT NOT NULL,
  "slug"        TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "iconName"    TEXT,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "BusinessProfile" (
  "id"            TEXT NOT NULL PRIMARY KEY,
  "businessId"    TEXT NOT NULL UNIQUE,
  "categoryId"    TEXT,
  "slug"          TEXT NOT NULL UNIQUE,
  "tagline"       TEXT,
  "description"   TEXT,
  "logoUrl"       TEXT,
  "bannerUrl"     TEXT,
  "websiteUrl"    TEXT,
  "phone"         TEXT,
  "email"         TEXT,
  "address"       TEXT,
  "city"          TEXT,
  "country"       TEXT,
  "averageRating" DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  "reviewCount"   INTEGER NOT NULL DEFAULT 0,
  "isFeatured"    BOOLEAN NOT NULL DEFAULT false,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BusinessProfile_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE,
  CONSTRAINT "BusinessProfile_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BusinessCategory"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "MarketplaceReview" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "businessId"   TEXT NOT NULL,
  "reviewerId"   TEXT NOT NULL,
  "orderId"      TEXT,
  "rating"       INTEGER NOT NULL,
  "title"        TEXT,
  "body"         TEXT,
  "isVerified"   BOOLEAN NOT NULL DEFAULT false,
  "isHidden"     BOOLEAN NOT NULL DEFAULT false,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketplaceReview_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE,
  CONSTRAINT "MarketplaceReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "MarketplaceReview_rating_check" CHECK ("rating" BETWEEN 1 AND 5)
);

CREATE INDEX IF NOT EXISTS "MarketplaceReview_businessId_createdAt_idx"
  ON "MarketplaceReview"("businessId", "createdAt");

CREATE INDEX IF NOT EXISTS "BusinessProfile_slug_idx"
  ON "BusinessProfile"("slug");

CREATE INDEX IF NOT EXISTS "BusinessProfile_isFeatured_idx"
  ON "BusinessProfile"("isFeatured");

-- ============================================================
-- Platform Admin
-- ============================================================

CREATE TABLE IF NOT EXISTS "PlatformMetrics" (
  "id"                TEXT         NOT NULL PRIMARY KEY,
  "periodType"        TEXT         NOT NULL,
  "periodStart"       TIMESTAMP(3) NOT NULL,
  "periodEnd"         TIMESTAMP(3) NOT NULL,
  "gmv"               DECIMAL(18,2) NOT NULL DEFAULT 0,
  "totalOrders"       INTEGER      NOT NULL DEFAULT 0,
  "newUsers"          INTEGER      NOT NULL DEFAULT 0,
  "activeBusinesses"  INTEGER      NOT NULL DEFAULT 0,
  "totalRevenue"      DECIMAL(18,2) NOT NULL DEFAULT 0,
  "commissionRevenue" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "refundAmount"      DECIMAL(18,2) NOT NULL DEFAULT 0,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "PlatformMetrics_periodStart_idx"
  ON "PlatformMetrics"("periodType", "periodStart");

CREATE TABLE IF NOT EXISTS "PlatformAnnouncement" (
  "id"           TEXT         NOT NULL PRIMARY KEY,
  "title"        TEXT         NOT NULL,
  "body"         TEXT         NOT NULL,
  "type"         TEXT         NOT NULL DEFAULT 'info',
  "audience"     TEXT         NOT NULL DEFAULT 'all',
  "isPublished"  BOOLEAN      NOT NULL DEFAULT false,
  "publishedAt"  TIMESTAMP(3),
  "expiresAt"    TIMESTAMP(3),
  "authorId"     TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlatformAnnouncement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "BusinessVerification" (
  "id"                 TEXT         NOT NULL PRIMARY KEY,
  "businessId"         TEXT         NOT NULL UNIQUE,
  "status"             TEXT         NOT NULL DEFAULT 'pending',
  "submittedAt"        TIMESTAMP(3),
  "reviewedAt"         TIMESTAMP(3),
  "reviewedByAdminId"  TEXT,
  "verificationNotes"  TEXT,
  "documentsJson"      JSONB        NOT NULL DEFAULT '[]',
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BusinessVerification_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE,
  CONSTRAINT "BusinessVerification_reviewedByAdminId_fkey" FOREIGN KEY ("reviewedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "PlatformDispute" (
  "id"                TEXT         NOT NULL PRIMARY KEY,
  "orderId"           TEXT,
  "businessId"        TEXT,
  "customerId"        TEXT,
  "assignedAdminId"   TEXT,
  "status"            TEXT         NOT NULL DEFAULT 'open',
  "type"              TEXT         NOT NULL,
  "title"             TEXT         NOT NULL,
  "description"       TEXT         NOT NULL,
  "resolution"        TEXT,
  "resolvedAt"        TIMESTAMP(3),
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlatformDispute_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL,
  CONSTRAINT "PlatformDispute_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL,
  CONSTRAINT "PlatformDispute_assignedAdminId_fkey" FOREIGN KEY ("assignedAdminId") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "PlatformDispute_status_idx"
  ON "PlatformDispute"("status", "createdAt");

-- ============================================================
-- Stripe Integration
-- ============================================================

CREATE TABLE IF NOT EXISTS "StripeAccount" (
  "id"                  TEXT         NOT NULL PRIMARY KEY,
  "businessId"          TEXT         NOT NULL UNIQUE,
  "stripeAccountId"     TEXT         NOT NULL UNIQUE,
  "onboardingStatus"    TEXT         NOT NULL DEFAULT 'pending',
  "chargesEnabled"      BOOLEAN      NOT NULL DEFAULT false,
  "payoutsEnabled"      BOOLEAN      NOT NULL DEFAULT false,
  "detailsSubmitted"    BOOLEAN      NOT NULL DEFAULT false,
  "defaultCurrency"     TEXT         NOT NULL DEFAULT 'usd',
  "country"             TEXT,
  "email"               TEXT,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StripeAccount_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "StripeCustomer" (
  "id"               TEXT         NOT NULL PRIMARY KEY,
  "userId"           TEXT         NOT NULL UNIQUE,
  "stripeCustomerId" TEXT         NOT NULL UNIQUE,
  "email"            TEXT,
  "name"             TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StripeCustomer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "StripePaymentIntent" (
  "id"                    TEXT         NOT NULL PRIMARY KEY,
  "stripePaymentIntentId" TEXT         NOT NULL UNIQUE,
  "orderId"               TEXT,
  "saleId"                TEXT,
  "businessId"            TEXT         NOT NULL,
  "amount"                INTEGER      NOT NULL,
  "currency"              TEXT         NOT NULL DEFAULT 'usd',
  "status"                TEXT         NOT NULL,
  "applicationFeeAmount"  INTEGER,
  "transferData"          JSONB,
  "metadata"              JSONB        NOT NULL DEFAULT '{}',
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StripePaymentIntent_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "StripeWebhookEvent" (
  "id"               TEXT         NOT NULL PRIMARY KEY,
  "stripeEventId"    TEXT         NOT NULL UNIQUE,
  "type"             TEXT         NOT NULL,
  "livemode"         BOOLEAN      NOT NULL DEFAULT false,
  "payload"          JSONB        NOT NULL,
  "processedAt"      TIMESTAMP(3),
  "failedAt"         TIMESTAMP(3),
  "failureReason"    TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "StripeWebhookEvent_stripeEventId_idx"
  ON "StripeWebhookEvent"("stripeEventId");

CREATE INDEX IF NOT EXISTS "StripeWebhookEvent_type_processedAt_idx"
  ON "StripeWebhookEvent"("type", "processedAt");

-- ============================================================
-- Object Storage
-- ============================================================

CREATE TABLE IF NOT EXISTS "MediaAsset" (
  "id"           TEXT         NOT NULL PRIMARY KEY,
  "key"          TEXT         NOT NULL UNIQUE,
  "url"          TEXT         NOT NULL,
  "contentType"  TEXT         NOT NULL,
  "size"         INTEGER      NOT NULL,
  "uploadedById" TEXT,
  "entityType"   TEXT,
  "entityId"     TEXT,
  "businessId"   TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MediaAsset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL,
  CONSTRAINT "MediaAsset_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "MediaAsset_entityType_entityId_idx"
  ON "MediaAsset"("entityType", "entityId");

CREATE INDEX IF NOT EXISTS "MediaAsset_businessId_idx"
  ON "MediaAsset"("businessId");

-- ============================================================
-- Job Queue
-- ============================================================

CREATE TABLE IF NOT EXISTS "JobQueue" (
  "id"            TEXT         NOT NULL PRIMARY KEY,
  "type"          TEXT         NOT NULL,
  "payload"       JSONB        NOT NULL DEFAULT '{}',
  "status"        TEXT         NOT NULL DEFAULT 'pending',
  "attempts"      INTEGER      NOT NULL DEFAULT 0,
  "maxAttempts"   INTEGER      NOT NULL DEFAULT 3,
  "scheduledAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt"     TIMESTAMP(3),
  "completedAt"   TIMESTAMP(3),
  "failedAt"      TIMESTAMP(3),
  "error"         TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "JobQueue_status_scheduledAt_idx"
  ON "JobQueue"("status", "scheduledAt");

CREATE INDEX IF NOT EXISTS "JobQueue_type_status_idx"
  ON "JobQueue"("type", "status");

CREATE TABLE IF NOT EXISTS "JobLock" (
  "id"         TEXT         NOT NULL PRIMARY KEY,
  "lockKey"    TEXT         NOT NULL UNIQUE,
  "ownerId"    TEXT         NOT NULL,
  "expiresAt"  TIMESTAMP(3) NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "JobLock_lockKey_expiresAt_idx"
  ON "JobLock"("lockKey", "expiresAt");

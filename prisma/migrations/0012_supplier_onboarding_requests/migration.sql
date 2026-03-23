CREATE TABLE "SupplierOnboardingRequest" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "phone" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierOnboardingRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SupplierOnboardingRequest_email_key"
ON "SupplierOnboardingRequest"("email");

CREATE INDEX "SupplierOnboardingRequest_status_createdAt_idx"
ON "SupplierOnboardingRequest"("status", "createdAt");

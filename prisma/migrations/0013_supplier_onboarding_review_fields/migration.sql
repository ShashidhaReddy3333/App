ALTER TABLE "SupplierOnboardingRequest"
ADD COLUMN "reviewedByAdminId" TEXT,
ADD COLUMN "approvedBusinessId" TEXT,
ADD COLUMN "approvedSupplierId" TEXT,
ADD COLUMN "approvedUserId" TEXT,
ADD COLUMN "rejectionReason" TEXT;

CREATE INDEX "SupplierOnboardingRequest_approvedBusinessId_idx"
ON "SupplierOnboardingRequest"("approvedBusinessId");

CREATE INDEX "SupplierOnboardingRequest_approvedUserId_idx"
ON "SupplierOnboardingRequest"("approvedUserId");

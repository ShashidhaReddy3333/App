CREATE TABLE "SupplierOrganization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierOrganization_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "User"
ADD COLUMN "supplierOrganizationId" TEXT;

ALTER TABLE "Supplier"
ADD COLUMN "organizationId" TEXT;

ALTER TABLE "SupplierOnboardingRequest"
ADD COLUMN "approvedSupplierOrganizationId" TEXT;

CREATE INDEX "User_supplierOrganizationId_idx"
ON "User"("supplierOrganizationId");

CREATE INDEX "Supplier_organizationId_idx"
ON "Supplier"("organizationId");

CREATE INDEX "SupplierOnboardingRequest_approvedSupplierOrganizationId_idx"
ON "SupplierOnboardingRequest"("approvedSupplierOrganizationId");

ALTER TABLE "User"
ADD CONSTRAINT "User_supplierOrganizationId_fkey"
FOREIGN KEY ("supplierOrganizationId") REFERENCES "SupplierOrganization"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Supplier"
ADD CONSTRAINT "Supplier_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "SupplierOrganization"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SupplierOnboardingRequest"
ADD CONSTRAINT "SupplierOnboardingRequest_approvedSupplierOrganizationId_fkey"
FOREIGN KEY ("approvedSupplierOrganizationId") REFERENCES "SupplierOrganization"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

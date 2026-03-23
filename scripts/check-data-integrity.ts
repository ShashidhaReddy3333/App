import { existsSync } from "node:fs";
import process from "node:process";

if (existsSync(".env")) {
  process.loadEnvFile?.(".env");
}

type IntegrityStatus = "ok" | "failed";

type SupplierOrganizationSnapshot = {
  id: string;
  name: string;
  supplierCount: number;
  userCount: number;
  businesses: string[];
  users: string[];
};

type IntegritySection = {
  name: string;
  status: IntegrityStatus;
  metrics: Record<string, number>;
  issues: string[];
  snapshots?: SupplierOrganizationSnapshot[];
};

type IntegrityReport = {
  generatedAt: string;
  overallStatus: IntegrityStatus;
  inventory: IntegritySection;
  supplierOrganizations: IntegritySection;
  totals: {
    sectionsChecked: number;
    issueCount: number;
  };
};

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || null;
}

async function loadDb() {
  const { db } = await import("../src/lib/db");
  return db;
}

type DatabaseClient = Awaited<ReturnType<typeof loadDb>>;

function buildSection(
  name: string,
  metrics: Record<string, number>,
  issues: string[],
  snapshots?: SupplierOrganizationSnapshot[]
): IntegritySection {
  return {
    name,
    status: issues.length > 0 ? "failed" : "ok",
    metrics,
    issues,
    snapshots,
  };
}

async function collectInventoryReport(db: DatabaseClient): Promise<IntegritySection> {
  const balances = await db.inventoryBalance.findMany({
    include: {
      product: true,
      location: true,
    },
  });

  const issues: string[] = [];
  let negativeQuantityIssues = 0;
  let availabilityMismatchIssues = 0;

  for (const balance of balances) {
    const onHand = Number(balance.onHandQuantity);
    const reserved = Number(balance.reservedQuantity);
    const available = Number(balance.availableQuantity);

    if (reserved < 0 || onHand < 0 || available < 0) {
      negativeQuantityIssues += 1;
      issues.push(
        `Negative inventory detected for ${balance.product.name} at ${balance.location.name}.`
      );
    }

    if (Number((onHand - reserved).toFixed(3)) !== Number(available.toFixed(3))) {
      availabilityMismatchIssues += 1;
      issues.push(
        `Availability mismatch for ${balance.product.name} at ${balance.location.name}: onHand=${onHand}, reserved=${reserved}, available=${available}.`
      );
    }
  }

  return buildSection(
    "Inventory",
    {
      balancesChecked: balances.length,
      productsChecked: new Set(balances.map((balance) => balance.productId)).size,
      locationsChecked: new Set(balances.map((balance) => balance.locationId)).size,
      negativeQuantityIssues,
      availabilityMismatchIssues,
    },
    issues
  );
}

async function collectSupplierOrganizationReport(db: DatabaseClient): Promise<IntegritySection> {
  const [organizations, suppliers, supplierUsers, approvedRequests] = await Promise.all([
    db.supplierOrganization.findMany({
      include: {
        suppliers: {
          select: {
            id: true,
            name: true,
            business: {
              select: {
                businessName: true,
              },
            },
          },
        },
        users: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: [{ createdAt: "asc" }],
    }),
    db.supplier.findMany({
      include: {
        business: {
          select: { businessName: true },
        },
        portalAccount: {
          select: {
            id: true,
            email: true,
            role: true,
            businessId: true,
            supplierId: true,
            supplierOrganizationId: true,
          },
        },
      },
      orderBy: [{ createdAt: "asc" }],
    }),
    db.user.findMany({
      where: { role: "supplier" },
      include: {
        managedSupplier: {
          select: {
            id: true,
            businessId: true,
            name: true,
            email: true,
            organizationId: true,
          },
        },
        supplierOrganization: {
          include: {
            suppliers: {
              select: { id: true },
            },
          },
        },
      },
      orderBy: [{ createdAt: "asc" }],
    }),
    db.supplierOnboardingRequest.findMany({
      where: { status: "approved" },
      orderBy: [{ createdAt: "asc" }],
    }),
  ]);

  const organizationIds = new Set(organizations.map((organization) => organization.id));
  const supplierById = new Map(suppliers.map((supplier) => [supplier.id, supplier]));
  const supplierUserById = new Map(supplierUsers.map((user) => [user.id, user]));
  const issues: string[] = [];

  let orphanOrganizations = 0;
  let missingOrganizationLinks = 0;
  let mismatchedOrganizationLinks = 0;
  let emailMismatchIssues = 0;
  let missingApprovedEntities = 0;
  const snapshots = organizations.map((organization) => ({
    id: organization.id,
    name: organization.name,
    supplierCount: organization.suppliers.length,
    userCount: organization.users.length,
    businesses: Array.from(
      new Set(organization.suppliers.map((supplier) => supplier.business.businessName))
    ),
    users: organization.users
      .map((user) => user.email)
      .sort((left, right) => left.localeCompare(right)),
  }));

  for (const organization of organizations) {
    if (organization.suppliers.length === 0) {
      orphanOrganizations += 1;
      issues.push(
        `Supplier organization "${organization.name}" (${organization.id}) has no linked supplier relationships.`
      );
    }
  }

  for (const supplier of suppliers) {
    const supplierLabel = `Supplier "${supplier.name}" (${supplier.id}) for business "${supplier.business.businessName}"`;

    if (!supplier.organizationId) {
      missingOrganizationLinks += 1;
      issues.push(`${supplierLabel} is missing organizationId.`);
    } else if (!organizationIds.has(supplier.organizationId)) {
      missingOrganizationLinks += 1;
      issues.push(`${supplierLabel} references missing organization ${supplier.organizationId}.`);
    }

    const portalAccount = supplier.portalAccount;
    if (!portalAccount) {
      continue;
    }

    if (portalAccount.role !== "supplier") {
      mismatchedOrganizationLinks += 1;
      issues.push(`${supplierLabel} is linked to non-supplier user ${portalAccount.email}.`);
    }

    if (!portalAccount.supplierOrganizationId) {
      missingOrganizationLinks += 1;
      issues.push(
        `${supplierLabel} has portal user ${portalAccount.email} without supplierOrganizationId.`
      );
    } else if (
      supplier.organizationId &&
      portalAccount.supplierOrganizationId !== supplier.organizationId
    ) {
      mismatchedOrganizationLinks += 1;
      issues.push(
        `${supplierLabel} disagrees with portal user ${portalAccount.email} on organization membership (${supplier.organizationId} vs ${portalAccount.supplierOrganizationId}).`
      );
    }

    if (portalAccount.supplierId !== supplier.id) {
      mismatchedOrganizationLinks += 1;
      issues.push(
        `${supplierLabel} is linked to portal user ${portalAccount.email} with mismatched supplierId.`
      );
    }

    if (portalAccount.businessId && portalAccount.businessId !== supplier.businessId) {
      mismatchedOrganizationLinks += 1;
      issues.push(
        `${supplierLabel} is linked to portal user ${portalAccount.email} with mismatched businessId (${portalAccount.businessId} vs ${supplier.businessId}).`
      );
    }
  }

  for (const user of supplierUsers) {
    const userLabel = `Supplier user "${user.email}" (${user.id})`;

    if (!user.supplierOrganizationId && !user.supplierId) {
      missingOrganizationLinks += 1;
      issues.push(`${userLabel} has neither supplierOrganizationId nor supplierId.`);
    }

    if (user.supplierOrganizationId && !organizationIds.has(user.supplierOrganizationId)) {
      missingOrganizationLinks += 1;
      issues.push(
        `${userLabel} references missing supplier organization ${user.supplierOrganizationId}.`
      );
    }

    if (!user.managedSupplier && !user.supplierOrganization) {
      missingOrganizationLinks += 1;
      issues.push(`${userLabel} cannot resolve any supplier relationship.`);
      continue;
    }

    if (user.managedSupplier) {
      if (!user.managedSupplier.organizationId) {
        missingOrganizationLinks += 1;
        issues.push(
          `${userLabel} manages supplier ${user.managedSupplier.id} without organizationId.`
        );
      } else if (
        user.supplierOrganizationId &&
        user.managedSupplier.organizationId !== user.supplierOrganizationId
      ) {
        mismatchedOrganizationLinks += 1;
        issues.push(
          `${userLabel} disagrees with managed supplier ${user.managedSupplier.id} on organization membership (${user.supplierOrganizationId} vs ${user.managedSupplier.organizationId}).`
        );
      }

      if (user.businessId && user.businessId !== user.managedSupplier.businessId) {
        mismatchedOrganizationLinks += 1;
        issues.push(
          `${userLabel} has businessId ${user.businessId} but primary supplier relationship belongs to ${user.managedSupplier.businessId}.`
        );
      }
    }

    if (user.supplierOrganization && user.supplierOrganization.suppliers.length === 0) {
      orphanOrganizations += 1;
      issues.push(
        `${userLabel} belongs to supplier organization ${user.supplierOrganization.id} with no supplier relationships.`
      );
    }
  }

  for (const request of approvedRequests) {
    const requestLabel = `Approved supplier request "${request.email}" (${request.id})`;
    const approvedSupplier = request.approvedSupplierId
      ? (supplierById.get(request.approvedSupplierId) ?? null)
      : null;
    const approvedUser = request.approvedUserId
      ? (supplierUserById.get(request.approvedUserId) ?? null)
      : null;

    if (!request.approvedSupplierOrganizationId) {
      missingApprovedEntities += 1;
      issues.push(`${requestLabel} is missing approvedSupplierOrganizationId.`);
    } else if (!organizationIds.has(request.approvedSupplierOrganizationId)) {
      missingApprovedEntities += 1;
      issues.push(
        `${requestLabel} references missing supplier organization ${request.approvedSupplierOrganizationId}.`
      );
    }

    if (!request.approvedSupplierId || !approvedSupplier) {
      missingApprovedEntities += 1;
      issues.push(`${requestLabel} is missing an approved supplier relationship.`);
    } else if (
      request.approvedSupplierOrganizationId &&
      approvedSupplier.organizationId !== request.approvedSupplierOrganizationId
    ) {
      mismatchedOrganizationLinks += 1;
      issues.push(
        `${requestLabel} disagrees with supplier ${approvedSupplier.id} on organization membership (${request.approvedSupplierOrganizationId} vs ${approvedSupplier.organizationId}).`
      );
    }

    if (!request.approvedUserId || !approvedUser) {
      missingApprovedEntities += 1;
      issues.push(`${requestLabel} is missing an approved supplier user.`);
    } else if (
      request.approvedSupplierOrganizationId &&
      approvedUser.supplierOrganizationId !== request.approvedSupplierOrganizationId
    ) {
      mismatchedOrganizationLinks += 1;
      issues.push(
        `${requestLabel} disagrees with user ${approvedUser.id} on organization membership (${request.approvedSupplierOrganizationId} vs ${approvedUser.supplierOrganizationId}).`
      );
    }

    const requestEmail = normalizeEmail(request.email);
    if (approvedUser && requestEmail && normalizeEmail(approvedUser.email) !== requestEmail) {
      emailMismatchIssues += 1;
      issues.push(`${requestLabel} email does not match approved user ${approvedUser.email}.`);
    }

    if (
      approvedSupplier &&
      requestEmail &&
      normalizeEmail(approvedSupplier.email) !== requestEmail
    ) {
      emailMismatchIssues += 1;
      issues.push(
        `${requestLabel} email does not match approved supplier ${approvedSupplier.email}.`
      );
    }
  }

  return buildSection(
    "Supplier organizations",
    {
      organizationsChecked: organizations.length,
      suppliersChecked: suppliers.length,
      supplierUsersChecked: supplierUsers.length,
      approvedRequestsChecked: approvedRequests.length,
      orphanOrganizations,
      missingOrganizationLinks,
      mismatchedOrganizationLinks,
      emailMismatchIssues,
      missingApprovedEntities,
    },
    issues,
    snapshots
  );
}

function createReport(sections: IntegritySection[]): IntegrityReport {
  const issueCount = sections.reduce((sum, section) => sum + section.issues.length, 0);

  return {
    generatedAt: new Date().toISOString(),
    overallStatus: issueCount > 0 ? "failed" : "ok",
    inventory: sections[0]!,
    supplierOrganizations: sections[1]!,
    totals: {
      sectionsChecked: sections.length,
      issueCount,
    },
  };
}

function printHumanReport(report: IntegrityReport) {
  console.log("Integrity report");
  console.log(`Generated at: ${report.generatedAt}`);
  console.log(`Overall status: ${report.overallStatus.toUpperCase()}`);
  console.log("");

  for (const section of [report.inventory, report.supplierOrganizations]) {
    console.log(`${section.name}: ${section.status.toUpperCase()}`);
    for (const [metric, value] of Object.entries(section.metrics)) {
      console.log(`  ${metric}: ${value}`);
    }

    if (section.issues.length > 0) {
      console.log("  Issues:");
      for (const issue of section.issues) {
        console.log(`    - ${issue}`);
      }
    }

    if (section.snapshots && section.snapshots.length > 0) {
      console.log("  Organization snapshots:");
      for (const snapshot of section.snapshots) {
        console.log(
          `    - ${snapshot.name} (${snapshot.id}) | suppliers=${snapshot.supplierCount} | users=${snapshot.userCount}`
        );
        console.log(
          `      businesses: ${snapshot.businesses.length > 0 ? snapshot.businesses.join(", ") : "none"}`
        );
        console.log(
          `      users: ${snapshot.users.length > 0 ? snapshot.users.join(", ") : "none"}`
        );
      }
    }

    console.log("");
  }
}

async function main() {
  const outputJson = process.argv.includes("--json");
  const [{ validateRuntimeEnvironment }, db] = await Promise.all([
    import("../src/lib/env"),
    loadDb(),
  ]);

  validateRuntimeEnvironment({ allowWarnings: true });

  const sections = await Promise.all([
    collectInventoryReport(db),
    collectSupplierOrganizationReport(db),
  ]);

  const report = createReport(sections);

  if (outputJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printHumanReport(report);
  }

  if (report.overallStatus === "failed") {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

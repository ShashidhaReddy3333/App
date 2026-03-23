import { existsSync } from "node:fs";
import process from "node:process";

if (existsSync(".env")) {
  process.loadEnvFile?.(".env");
}

type OrganizationRecord = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || null;
}

async function main() {
  const [{ db }, { validateRuntimeEnvironment }] = await Promise.all([
    import("../src/lib/db"),
    import("../src/lib/env"),
  ]);
  validateRuntimeEnvironment({ allowWarnings: true });

  const write = process.argv.includes("--write");
  let plannedOrganizationCount = 0;
  let createdOrganizations = 0;
  let linkedSuppliers = 0;
  let linkedUsers = 0;
  let linkedRequests = 0;

  const [existingOrganizations, suppliers, supplierUsers, requests] = await Promise.all([
    db.supplierOrganization.findMany(),
    db.supplier.findMany({
      include: {
        organization: true,
        portalAccount: true,
        business: true,
      },
      orderBy: [{ createdAt: "asc" }],
    }),
    db.user.findMany({
      where: { role: "supplier" },
      include: {
        managedSupplier: {
          include: {
            organization: true,
          },
        },
        supplierOrganization: true,
      },
      orderBy: [{ createdAt: "asc" }],
    }),
    db.supplierOnboardingRequest.findMany({
      where: { status: "approved" },
      orderBy: [{ createdAt: "asc" }],
    }),
  ]);

  const organizationById = new Map<string, OrganizationRecord>();
  const organizationIdByEmail = new Map<string, string>();
  const supplierOrganizationIdBySupplierId = new Map<string, string | null>();
  const supplierOrganizationIdByUserId = new Map<string, string | null>();

  function rememberOrganization(record: OrganizationRecord) {
    organizationById.set(record.id, record);
    const normalizedEmail = normalizeEmail(record.email);
    if (normalizedEmail) {
      organizationIdByEmail.set(normalizedEmail, record.id);
    }
  }

  for (const organization of existingOrganizations) {
    rememberOrganization(organization);
  }

  async function getOrCreateOrganization(input: {
    name: string;
    email?: string | null;
    phone?: string | null;
    notes?: string | null;
  }) {
    const normalizedEmail = normalizeEmail(input.email);
    const existingId = normalizedEmail ? organizationIdByEmail.get(normalizedEmail) : null;
    if (existingId) {
      return organizationById.get(existingId)!;
    }

    if (!write) {
      const planned: OrganizationRecord = {
        id: `planned-organization-${++plannedOrganizationCount}`,
        name: input.name,
        email: normalizedEmail,
        phone: input.phone || null,
        notes: input.notes || null,
      };
      rememberOrganization(planned);
      createdOrganizations += 1;
      return planned;
    }

    const created = await db.supplierOrganization.create({
      data: {
        name: input.name,
        email: normalizedEmail,
        phone: input.phone || null,
        notes: input.notes || null,
      },
    });
    rememberOrganization(created);
    createdOrganizations += 1;
    return created;
  }

  for (const supplier of suppliers) {
    let targetOrganization =
      (supplier.organizationId ? organizationById.get(supplier.organizationId) : null) ??
      (supplier.portalAccount?.supplierOrganizationId
        ? organizationById.get(supplier.portalAccount.supplierOrganizationId)
        : null) ??
      null;

    if (!targetOrganization) {
      targetOrganization = await getOrCreateOrganization({
        name: supplier.name,
        email: supplier.email ?? supplier.portalAccount?.email,
        phone: supplier.phone,
        notes: supplier.notes,
      });
    }

    supplierOrganizationIdBySupplierId.set(supplier.id, targetOrganization.id);

    if (supplier.organizationId !== targetOrganization.id) {
      if (write && !targetOrganization.id.startsWith("planned-organization-")) {
        await db.supplier.update({
          where: { id: supplier.id },
          data: { organizationId: targetOrganization.id },
        });
      }
      linkedSuppliers += 1;
    }

    if (
      supplier.portalAccount &&
      supplier.portalAccount.supplierOrganizationId !== targetOrganization.id
    ) {
      if (write && !targetOrganization.id.startsWith("planned-organization-")) {
        await db.user.update({
          where: { id: supplier.portalAccount.id },
          data: { supplierOrganizationId: targetOrganization.id },
        });
      }
      linkedUsers += 1;
      supplierOrganizationIdByUserId.set(supplier.portalAccount.id, targetOrganization.id);
    } else if (supplier.portalAccount) {
      supplierOrganizationIdByUserId.set(
        supplier.portalAccount.id,
        supplier.portalAccount.supplierOrganizationId
      );
    }
  }

  for (const user of supplierUsers) {
    let targetOrganization =
      (user.supplierOrganizationId ? organizationById.get(user.supplierOrganizationId) : null) ??
      (user.managedSupplier?.organizationId
        ? organizationById.get(user.managedSupplier.organizationId)
        : null) ??
      null;

    if (!targetOrganization) {
      targetOrganization = await getOrCreateOrganization({
        name: user.managedSupplier?.name ?? user.fullName,
        email: user.email,
        phone: user.managedSupplier?.phone ?? null,
        notes: user.managedSupplier?.notes ?? null,
      });
    }

    supplierOrganizationIdByUserId.set(user.id, targetOrganization.id);

    if (user.supplierOrganizationId !== targetOrganization.id) {
      if (write && !targetOrganization.id.startsWith("planned-organization-")) {
        await db.user.update({
          where: { id: user.id },
          data: { supplierOrganizationId: targetOrganization.id },
        });
      }
      linkedUsers += 1;
    }

    if (user.managedSupplier && user.managedSupplier.organizationId !== targetOrganization.id) {
      if (write && !targetOrganization.id.startsWith("planned-organization-")) {
        await db.supplier.update({
          where: { id: user.managedSupplier.id },
          data: { organizationId: targetOrganization.id },
        });
      }
      linkedSuppliers += 1;
      supplierOrganizationIdBySupplierId.set(user.managedSupplier.id, targetOrganization.id);
    }
  }

  for (const request of requests) {
    const targetOrganizationId =
      (request.approvedSupplierOrganizationId &&
      organizationById.has(request.approvedSupplierOrganizationId)
        ? request.approvedSupplierOrganizationId
        : null) ??
      (request.approvedSupplierId
        ? (supplierOrganizationIdBySupplierId.get(request.approvedSupplierId) ?? null)
        : null) ??
      (request.approvedUserId
        ? (supplierOrganizationIdByUserId.get(request.approvedUserId) ?? null)
        : null);

    if (!targetOrganizationId || request.approvedSupplierOrganizationId === targetOrganizationId) {
      continue;
    }

    if (write && !targetOrganizationId.startsWith("planned-organization-")) {
      await db.supplierOnboardingRequest.update({
        where: { id: request.id },
        data: { approvedSupplierOrganizationId: targetOrganizationId },
      });
    }
    linkedRequests += 1;
  }

  console.log(
    write ? "Supplier organization backfill applied." : "Supplier organization backfill dry run."
  );
  console.log(`Organizations created: ${createdOrganizations}`);
  console.log(`Suppliers linked: ${linkedSuppliers}`);
  console.log(`Supplier users linked: ${linkedUsers}`);
  console.log(`Approved requests linked: ${linkedRequests}`);

  if (!write) {
    console.log("Run again with --write to persist these changes.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

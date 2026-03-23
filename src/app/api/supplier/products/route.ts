import { requireApiAccess } from "@/lib/auth/api-guard";
import { notFoundError } from "@/lib/errors";
import { apiError, apiSuccess } from "@/lib/http";
import { createSupplierProduct } from "@/lib/services/procurement-command-service";
import {
  getSupplierPortalContext,
  listSupplierPortalData,
} from "@/lib/services/procurement-query-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { session } = await requireApiAccess("supplier_portal", {
      roles: ["supplier"],
      allowMissingBusiness: true,
    });
    return apiSuccess(await listSupplierPortalData(session.user.id));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { session } = await requireApiAccess("supplier_portal", {
      roles: ["supplier"],
      allowMissingBusiness: true,
      request,
    });
    const context = await getSupplierPortalContext(session.user.id);
    if (!context.primarySupplier) {
      throw notFoundError("Supplier profile not found.");
    }
    const payload = await request.json();
    const supplierId =
      typeof payload?.supplierId === "string" && context.supplierIds.includes(payload.supplierId)
        ? payload.supplierId
        : context.primarySupplier.id;
    const targetRelationship =
      context.suppliers.find((supplier) => supplier.id === supplierId) ?? context.primarySupplier;
    const supplierProduct = await createSupplierProduct(
      session.user.id,
      targetRelationship.businessId,
      targetRelationship.id,
      payload
    );
    return apiSuccess(
      { supplierProduct: { id: supplierProduct.id } },
      { status: 201, message: "Wholesale product created." }
    );
  } catch (error) {
    return apiError(error);
  }
}

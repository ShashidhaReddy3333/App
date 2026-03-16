import { requireApiAccess } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/http";
import { createSupplierProduct } from "@/lib/services/procurement-command-service";
import { listSupplierPortalData } from "@/lib/services/procurement-query-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { session } = await requireApiAccess("supplier_portal", { roles: ["supplier"] });
    return apiSuccess(await listSupplierPortalData(session.user.id));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { session, businessId } = await requireApiAccess("supplier_portal", { roles: ["supplier"] });
    if (!session.user.supplierId) {
      throw new Error("Supplier profile not found.");
    }
    const payload = await request.json();
    const supplierProduct = await createSupplierProduct(session.user.id, businessId!, session.user.supplierId, payload);
    return apiSuccess({ supplierProduct: { id: supplierProduct.id } }, { status: 201, message: "Wholesale product created." });
  } catch (error) {
    return apiError(error);
  }
}

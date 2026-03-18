import { requireApiAccess } from "@/lib/auth/api-guard";
import { forbiddenError } from "@/lib/errors";
import { apiError, apiSuccess } from "@/lib/http";
import { createSupplierProduct } from "@/lib/services/procurement-command-service";
import { listSupplierPortalData } from "@/lib/services/procurement-query-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { session } = await requireApiAccess("supplier_portal", { roles: ["supplier"] });
    if (!session.user.supplierId) {
      return apiError(forbiddenError("Supplier account not linked"));
    }

    const data = await listSupplierPortalData(session.user.id);
    if (data.supplier.id !== session.user.supplierId) {
      return apiError(forbiddenError("Supplier access denied"));
    }

    return apiSuccess(data);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { session, businessId } = await requireApiAccess("supplier_portal", { roles: ["supplier"] });
    if (!session.user.supplierId) {
      return apiError(forbiddenError("Supplier account not linked"));
    }
    const payload = await request.json();

    // Force supplierId to the authenticated user's supplier
    const supplierId = session.user.supplierId;
    const safePayload =
      payload && typeof payload === "object"
        ? { ...(payload as Record<string, unknown>), supplierId }
        : payload;

    const supplierProduct = await createSupplierProduct(session.user.id, businessId!, supplierId, safePayload);
    return apiSuccess({ supplierProduct: { id: supplierProduct.id } }, { status: 201, message: "Wholesale product created." });
  } catch (error) {
    return apiError(error);
  }
}

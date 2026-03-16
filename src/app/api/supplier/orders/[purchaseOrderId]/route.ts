import { requireApiAccess } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/http";
import { updateSupplierPurchaseOrderStatus } from "@/lib/services/procurement-command-service";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ purchaseOrderId: string }> }
) {
  try {
    const { purchaseOrderId } = await params;
    const { session } = await requireApiAccess("supplier_portal", { roles: ["supplier"] });
    const payload = await request.json();
    const purchaseOrder = await updateSupplierPurchaseOrderStatus(session.user.id, purchaseOrderId, payload);
    return apiSuccess({ purchaseOrder: { id: purchaseOrder.id } }, { message: "Purchase order updated." });
  } catch (error) {
    return apiError(error);
  }
}

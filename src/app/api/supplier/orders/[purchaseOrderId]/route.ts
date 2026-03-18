import { requireApiAccess } from "@/lib/auth/api-guard";
import { db } from "@/lib/db";
import { forbiddenError, notFoundError } from "@/lib/errors";
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
    if (!session.user.supplierId) {
      return apiError(forbiddenError("Supplier account not linked"));
    }

    const purchaseOrder = await db.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      select: { supplierId: true }
    });
    if (!purchaseOrder || purchaseOrder.supplierId !== session.user.supplierId) {
      return apiError(notFoundError("Purchase order not found or access denied"));
    }

    const payload = await request.json();
    const updatedPurchaseOrder = await updateSupplierPurchaseOrderStatus(session.user.id, purchaseOrderId, payload);
    return apiSuccess({ purchaseOrder: { id: updatedPurchaseOrder.id } }, { message: "Purchase order updated." });
  } catch (error) {
    return apiError(error);
  }
}

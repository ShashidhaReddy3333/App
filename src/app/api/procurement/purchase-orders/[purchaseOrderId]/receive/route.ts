import { requireApiAccess } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/http";
import { receivePurchaseOrder } from "@/lib/services/procurement-command-service";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ purchaseOrderId: string }> }
) {
  try {
    const { purchaseOrderId } = await params;
    const { session, businessId } = await requireApiAccess("procurement");
    const payload = await request.json();
    const purchaseOrder = await receivePurchaseOrder(session.user.id, businessId!, purchaseOrderId, payload);
    return apiSuccess({ purchaseOrder: { id: purchaseOrder.id } }, { message: "Goods received." });
  } catch (error) {
    return apiError(error);
  }
}

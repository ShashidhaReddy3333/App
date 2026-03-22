import { requireApiAccess } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/http";
import { quickReceivePurchaseOrder } from "@/lib/services/procurement-command-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { session, businessId } = await requireApiAccess("procurement", { request });
    const payload = await request.json();
    const purchaseOrder = await quickReceivePurchaseOrder(session.user.id, businessId!, payload);
    return apiSuccess(
      { purchaseOrder: { id: purchaseOrder.id } },
      { status: 201, message: "Stock received and inventory updated." }
    );
  } catch (error) {
    return apiError(error);
  }
}

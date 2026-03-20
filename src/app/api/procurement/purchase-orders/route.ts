import { requireApiAccess } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/http";
import { createPurchaseOrder } from "@/lib/services/procurement-command-service";
import { listProcurementData } from "@/lib/services/procurement-query-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { businessId } = await requireApiAccess("procurement");
    return apiSuccess(await listProcurementData(businessId!));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { session, businessId } = await requireApiAccess("procurement", { request });
    const payload = await request.json();
    const purchaseOrder = await createPurchaseOrder(session.user.id, businessId!, payload);
    return apiSuccess({ purchaseOrder: { id: purchaseOrder.id } }, { status: 201, message: "Purchase order created." });
  } catch (error) {
    return apiError(error);
  }
}

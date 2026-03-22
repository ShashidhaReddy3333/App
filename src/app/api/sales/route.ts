import { requireApiAccess } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/http";
import { listSales } from "@/lib/services/sales-query-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { businessId } = await requireApiAccess("sales");
    const sales = await listSales(businessId, { page: 1, pageSize: 100 });
    return apiSuccess({ sales: sales.items });
  } catch (error) {
    return apiError(error);
  }
}

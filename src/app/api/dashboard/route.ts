import { requireApiAccess } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/http";
import { getDashboardMetrics } from "@/lib/services/reporting-query-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { businessId } = await requireApiAccess();
    return apiSuccess(await getDashboardMetrics(businessId));
  } catch (error) {
    return apiError(error);
  }
}

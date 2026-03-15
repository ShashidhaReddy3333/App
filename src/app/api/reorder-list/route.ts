import { requireApiAccess } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/http";
import { listReorderItems } from "@/lib/services/catalog-query-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { businessId } = await requireApiAccess("reorder");
    const items = await listReorderItems(businessId);
    return apiSuccess({ items });
  } catch (error) {
    return apiError(error);
  }
}

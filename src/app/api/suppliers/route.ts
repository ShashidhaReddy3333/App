import { requireApiAccess } from "@/lib/auth/api-guard";
import { checkRateLimit } from "@/lib/api-rate-limit";
import { apiError, apiSuccess } from "@/lib/http";
import { createSupplier } from "@/lib/services/catalog-command-service";
import { listCatalogData } from "@/lib/services/catalog-query-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { businessId } = await requireApiAccess("suppliers");
    const data = await listCatalogData(businessId);
    return apiSuccess({ suppliers: data.suppliers, location: data.location });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  const rateLimitResponse = checkRateLimit(request, { limit: 20, windowMs: 60_000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { session, businessId } = await requireApiAccess("suppliers", { request });
    const payload = await request.json();
    const supplier = await createSupplier(session.user.id, businessId, payload);
    return apiSuccess({ supplier }, { status: 201, message: "Supplier created." });
  } catch (error) {
    return apiError(error);
  }
}

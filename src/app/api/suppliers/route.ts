import { requireApiAccess } from "@/lib/auth/api-guard";
import { withRateLimit } from "@/lib/api-rate-limit";
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

const postHandler = async (request: Request) => {
  try {
    const { session, businessId } = await requireApiAccess("suppliers");
    const payload = await request.json();
    const supplier = await createSupplier(session.user.id, businessId, payload);
    return apiSuccess({ supplier }, { status: 201, message: "Supplier created." });
  } catch (error) {
    return apiError(error);
  }
};

export const POST = withRateLimit(postHandler, { limit: 20, windowMs: 60_000 });

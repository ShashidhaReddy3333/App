import { withRateLimit } from "@/lib/api-rate-limit";
import { requireApiAccess } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/http";
import { createProduct } from "@/lib/services/catalog-command-service";
import { listCatalogData } from "@/lib/services/catalog-query-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { businessId } = await requireApiAccess("products");
    const data = await listCatalogData(businessId);
    return apiSuccess(data);
  } catch (error) {
    return apiError(error);
  }
}

const postHandler = async (request: Request) => {
  try {
    const { session, businessId } = await requireApiAccess("products", { request });
    const payload = await request.json();
    const product = await createProduct(session.user.id, businessId, payload);
    return apiSuccess({ product }, { status: 201, message: "Product created." });
  } catch (error) {
    return apiError(error);
  }
};

export const POST = withRateLimit(postHandler, { limit: 30, windowMs: 60_000 });

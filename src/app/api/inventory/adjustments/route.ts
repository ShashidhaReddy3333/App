import { requireApiAccess } from "@/lib/auth/api-guard";
import { withRateLimit } from "@/lib/api-rate-limit";
import { apiError, apiSuccess } from "@/lib/http";
import { adjustInventory } from "@/lib/services/catalog-command-service";

export const dynamic = "force-dynamic";

const postHandler = async (request: Request) => {
  try {
    const { session, businessId } = await requireApiAccess("inventory");
    const payload = await request.json();
    const movement = await adjustInventory(session.user.id, businessId, payload);
    return apiSuccess({ movement }, { status: 201, message: "Inventory adjusted." });
  } catch (error) {
    return apiError(error);
  }
};

export const POST = withRateLimit(postHandler, { limit: 30, windowMs: 60_000 });

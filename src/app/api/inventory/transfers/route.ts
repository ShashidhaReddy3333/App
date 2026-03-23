import { withRateLimit } from "@/lib/api-rate-limit";
import { requireApiAccess } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/http";
import { transferInventory } from "@/lib/services/catalog-command-service";

export const dynamic = "force-dynamic";

const postHandler = async (request: Request) => {
  try {
    const { session, businessId } = await requireApiAccess("inventory", { request });
    const payload = await request.json();
    const transfer = await transferInventory(session.user.id, businessId, payload);
    return apiSuccess({ transfer }, { status: 201, message: "Inventory transferred." });
  } catch (error) {
    return apiError(error);
  }
};

export const POST = withRateLimit(postHandler, { limit: 20, windowMs: 60_000 });

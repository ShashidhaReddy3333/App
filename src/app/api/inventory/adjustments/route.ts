import { requireApiAccess } from "@/lib/auth/api-guard";
import { checkRateLimit } from "@/lib/api-rate-limit";
import { apiError, apiSuccess } from "@/lib/http";
import { adjustInventory } from "@/lib/services/catalog-command-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rateLimitResponse = checkRateLimit(request, { limit: 30, windowMs: 60_000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { session, businessId } = await requireApiAccess("inventory");
    const payload = await request.json();
    const movement = await adjustInventory(session.user.id, businessId, payload);
    return apiSuccess({ movement }, { status: 201, message: "Inventory adjusted." });
  } catch (error) {
    return apiError(error);
  }
}

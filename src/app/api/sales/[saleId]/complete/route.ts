import { requireApiAccess } from "@/lib/auth/api-guard";
import { withRateLimit } from "@/lib/api-rate-limit";
import { apiError, apiSuccess } from "@/lib/http";
import { completeSale } from "@/lib/services/sales-command-service";

export const dynamic = "force-dynamic";

type CompleteContext = { params: Promise<{ saleId: string }> };

const postHandler = async (request: Request, { params }: CompleteContext) => {
  try {
    const { session, businessId } = await requireApiAccess("sales", { request });
    const payload = await request.json();
    const { saleId } = await params;
    return apiSuccess(
      { sale: await completeSale(session.user.id, businessId, saleId, payload) },
      { message: "Sale completion processed." }
    );
  } catch (error) {
    return apiError(error);
  }
};

export const POST = withRateLimit(postHandler, { limit: 10, windowMs: 60_000 });

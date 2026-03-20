import { requireApiAccess } from "@/lib/auth/api-guard";
import { withRateLimit } from "@/lib/api-rate-limit";
import { apiError, apiSuccess } from "@/lib/http";
import { createRefund } from "@/lib/services/sales-command-service";

export const dynamic = "force-dynamic";

type RefundsContext = { params: Promise<{ saleId: string }> };

const postHandler = async (request: Request, { params }: RefundsContext) => {
  try {
    const { session, businessId } = await requireApiAccess("refunds", { request });
    const payload = await request.json();
    const { saleId } = await params;
    return apiSuccess(
      { refund: await createRefund(session.user.id, businessId, saleId, payload) },
      { status: 201, message: "Refund created." }
    );
  } catch (error) {
    return apiError(error);
  }
};

export const POST = withRateLimit(postHandler, { limit: 10, windowMs: 60_000 });

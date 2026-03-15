import { requireApiAccess } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/http";
import { createRefund } from "@/lib/services/sales-command-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ saleId: string }> }) {
  try {
    const { session, businessId } = await requireApiAccess("refunds");
    const payload = await request.json();
    const { saleId } = await params;
    return apiSuccess(
      { refund: await createRefund(session.user.id, businessId, saleId, payload) },
      { status: 201, message: "Refund created." }
    );
  } catch (error) {
    return apiError(error);
  }
}

import { requireApiAccess } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/http";
import { completeSale } from "@/lib/services/sales-command-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ saleId: string }> }) {
  try {
    const { session, businessId } = await requireApiAccess("sales");
    const payload = await request.json();
    const { saleId } = await params;
    return apiSuccess(
      { sale: await completeSale(session.user.id, businessId, saleId, payload) },
      { message: "Sale completion processed." }
    );
  } catch (error) {
    return apiError(error);
  }
}

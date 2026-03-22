import { requireApiAccess } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/http";
import { searchCustomers } from "@/lib/services/customer-directory-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireApiAccess("sales", { request });
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? "";
    const customers = await searchCustomers(q);
    return apiSuccess({ customers });
  } catch (error) {
    return apiError(error);
  }
}

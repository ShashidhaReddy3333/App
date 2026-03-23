import { z } from "zod";
import { NextRequest } from "next/server";

import { requirePlatformAdminAccess } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/http";
import {
  listSupplierOnboardingRequests,
  reviewSupplierOnboardingRequest,
} from "@/lib/services/auth-service";
import { listPlatformApprovalBusinesses } from "@/lib/services/platform-service";

export const dynamic = "force-dynamic";

const supplierRequestStatusSchema = z.enum(["pending", "approved", "rejected", "all"]);

export async function GET(req: NextRequest) {
  try {
    await requirePlatformAdminAccess(req);

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(Math.max(1, Number(searchParams.get("limit") ?? 25)), 100);
    const status = supplierRequestStatusSchema
      .catch("pending")
      .parse(searchParams.get("status") ?? "pending");

    const [requests, businesses] = await Promise.all([
      listSupplierOnboardingRequests({
        page,
        limit,
        status: status === "all" ? undefined : status,
      }),
      listPlatformApprovalBusinesses(),
    ]);

    return apiSuccess({ ...requests, businesses });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requirePlatformAdminAccess(req);
    const body = await req.json();
    const reviewed = await reviewSupplierOnboardingRequest(session.user.id, body);

    return apiSuccess(
      {
        request: reviewed.request,
        supplierOrganizationId: reviewed.supplierOrganization?.id ?? null,
        supplierId: reviewed.supplier?.id ?? null,
        userId: reviewed.user?.id ?? null,
      },
      {
        message:
          reviewed.request.status === "approved"
            ? "Supplier request approved."
            : "Supplier request rejected.",
      }
    );
  } catch (error) {
    return apiError(error);
  }
}

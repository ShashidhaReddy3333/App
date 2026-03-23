import { requirePlatformAdminAccess } from "@/lib/auth/api-guard";
import { db } from "@/lib/db";
import { notFoundError } from "@/lib/errors";
import { apiError, apiSuccess } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ disputeId: string }> }
) {
  try {
    await requirePlatformAdminAccess(request);
    const { disputeId } = await params;

    const dispute = await db.platformDispute.findUnique({
      where: { id: disputeId },
      include: {
        business: { select: { id: true, businessName: true } },
        customer: { select: { id: true, fullName: true, email: true } },
        assignedAdmin: { select: { id: true, fullName: true, email: true } },
        events: {
          include: {
            authorUser: { select: { id: true, fullName: true, email: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!dispute) {
      throw notFoundError("Dispute not found.");
    }

    return apiSuccess({ dispute });
  } catch (error) {
    return apiError(error);
  }
}

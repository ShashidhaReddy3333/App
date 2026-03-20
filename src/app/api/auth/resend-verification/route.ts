import { apiError, apiSuccess } from "@/lib/http";
import { requireApiAccess } from "@/lib/auth/api-guard";
import { resendVerificationEmail } from "@/lib/services/auth-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { session } = await requireApiAccess(undefined, {
      allowMissingBusiness: true,
      request
    });

    const result = await resendVerificationEmail(session.user.id);
    return apiSuccess(result, { message: "Verification email sent." });
  } catch (error) {
    return apiError(error);
  }
}

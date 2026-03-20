import { apiError, apiSuccess } from "@/lib/http";
import { verifyEmail } from "@/lib/services/auth-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { email, token } = await request.json();

    if (!email || !token) {
      return apiError(new Error("Email and token are required."));
    }

    const result = await verifyEmail(email, token);
    return apiSuccess(result, { message: "Email verified successfully." });
  } catch (error) {
    return apiError(error);
  }
}

import { apiError, apiSuccess } from "@/lib/http";
import { getBusinessProfile } from "@/lib/services/marketplace-service";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const profile = await getBusinessProfile(slug);
    return apiSuccess({ profile });
  } catch (error) {
    return apiError(error);
  }
}

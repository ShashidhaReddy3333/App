import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/http";
import { listBusinesses, listBusinessCategories, listBusinessesSchema } from "@/lib/services/marketplace-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const input = listBusinessesSchema.parse({
      query: searchParams.get("q") ?? undefined,
      categorySlug: searchParams.get("category") ?? undefined,
      featured: searchParams.get("featured") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const [result, categories] = await Promise.all([
      listBusinesses(input),
      listBusinessCategories(),
    ]);

    return apiSuccess({ ...result, categories });
  } catch (error) {
    return apiError(error);
  }
}

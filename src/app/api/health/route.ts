import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { apiError, apiSuccess } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;

    return apiSuccess(
      {
        ok: true,
        database: "reachable",
        appUrl: env.APP_URL
      },
      { message: "Application and database are healthy." }
    );
  } catch (error) {
    return apiError(error);
  }
}

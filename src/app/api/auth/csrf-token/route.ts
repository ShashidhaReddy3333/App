import { generateCsrfToken } from "@/lib/csrf";
import { apiSuccess } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = await generateCsrfToken();
  return apiSuccess({ csrfToken: token });
}

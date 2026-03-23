import { NextResponse } from "next/server";

import { getLegacyRequestMetadata, logLegacyCompatibilityHit } from "@/lib/legacy-compat";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  logLegacyCompatibilityHit("legacy_api_endpoint_hit", {
    endpoint: "/api/auth/sign-in",
    method: request.method,
    replacement:
      "/api/auth/customer/sign-in | /api/auth/retail/sign-in | /api/auth/supplier/sign-in | /api/auth/admin/sign-in",
    ...getLegacyRequestMetadata(request),
  });

  return NextResponse.json(
    {
      message:
        "This legacy endpoint has been removed. Use /api/auth/customer/sign-in, /api/auth/retail/sign-in, /api/auth/supplier/sign-in, or /api/auth/admin/sign-in.",
      code: "GONE",
    },
    { status: 410 }
  );
}

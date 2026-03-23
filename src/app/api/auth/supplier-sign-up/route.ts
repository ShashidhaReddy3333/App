import { NextResponse } from "next/server";

import { getLegacyRequestMetadata, logLegacyCompatibilityHit } from "@/lib/legacy-compat";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  logLegacyCompatibilityHit("legacy_api_endpoint_hit", {
    endpoint: "/api/auth/supplier-sign-up",
    method: request.method,
    replacement: "/api/auth/supplier/sign-up",
    ...getLegacyRequestMetadata(request),
  });

  return NextResponse.json(
    {
      message: "This legacy endpoint has been removed. Use /api/auth/supplier/sign-up instead.",
      code: "GONE",
    },
    { status: 410 }
  );
}

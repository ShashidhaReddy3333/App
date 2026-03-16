import { NextResponse } from "next/server";

import { toAppError } from "@/lib/errors";
import { captureServerException, wasErrorReported } from "@/lib/monitoring/sentry";

export function apiSuccess<T>(data: T, options?: { status?: number; message?: string }) {
  return NextResponse.json(
    {
      data,
      message: options?.message
    },
    { status: options?.status ?? 200 }
  );
}

export function apiError(error: unknown) {
  const appError = toAppError(error);
  if (appError.status >= 500 && !wasErrorReported(error)) {
    void captureServerException("api_error_response", error, {
      status: appError.status,
      code: appError.code
    });
  }

  return NextResponse.json(
    {
      message: appError.message,
      code: appError.code,
      issues: appError.issues
    },
    { status: appError.status }
  );
}

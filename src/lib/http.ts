import { NextResponse } from "next/server";

import { toAppError } from "@/lib/errors";

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

  return NextResponse.json(
    {
      message: appError.message,
      code: appError.code,
      issues: appError.issues
    },
    { status: appError.status }
  );
}

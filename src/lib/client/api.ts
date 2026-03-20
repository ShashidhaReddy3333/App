"use client";

import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

import { csrfFetch } from "@/lib/client/csrf";

type ApiEnvelope<T> = {
  data: T;
  message?: string;
};

export class ApiClientError extends Error {
  code?: string;
  issues?: Record<string, unknown>;

  constructor(message: string, options?: { code?: string; issues?: Record<string, unknown> }) {
    super(message);
    this.name = "ApiClientError";
    this.code = options?.code;
    this.issues = options?.issues;
  }
}

export async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await csrfFetch(input, init);
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> & {
    message?: string;
    code?: string;
    issues?: Record<string, unknown>;
  } | null;

  if (!response.ok) {
    throw new ApiClientError(payload?.message ?? "Request failed.", {
      code: payload?.code,
      issues: payload?.issues
    });
  }

  return payload?.data as T;
}

export function applyFormIssues<TFieldValues extends FieldValues>(form: UseFormReturn<TFieldValues>, issues?: Record<string, unknown>) {
  const fieldErrors = issues && "fieldErrors" in issues ? (issues.fieldErrors as Record<string, string[] | undefined>) : undefined;
  if (!fieldErrors) {
    return;
  }

  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (!messages?.length) continue;
    form.setError(field as Path<TFieldValues>, {
      type: "server",
      message: messages[0]
    });
  }
}

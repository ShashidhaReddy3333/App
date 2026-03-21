"use client";

import { requestJson } from "@/lib/client/api";

type CsrfFetchInit = Omit<RequestInit, "body"> & {
  body?: BodyInit | Record<string, unknown> | Array<unknown> | null;
};

function isJsonBody(value: unknown): value is Record<string, unknown> | Array<unknown> {
  return typeof value === "object" && value !== null && !(value instanceof FormData) && !(value instanceof URLSearchParams) && !(value instanceof Blob);
}

export async function csrfFetch<T>(input: RequestInfo | URL, init: CsrfFetchInit = {}) {
  const headers = new Headers(init.headers);
  let body = init.body;

  if (isJsonBody(body)) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(body);
  }

  return requestJson<T>(input, {
    ...init,
    headers,
    body,
    credentials: "same-origin"
  });
}

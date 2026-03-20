"use client";

let csrfToken: string | null = null;
let fetchPromise: Promise<string> | null = null;

const STATE_CHANGING_METHODS = ["POST", "PATCH", "DELETE", "PUT"];

/**
 * Fetches a fresh CSRF token from the server and caches it in memory.
 */
export async function fetchCsrfToken(): Promise<string> {
  const response = await fetch("/api/auth/csrf-token", { credentials: "same-origin" });
  if (!response.ok) {
    throw new Error("Failed to fetch CSRF token");
  }
  const payload = await response.json();
  csrfToken = payload.data.csrfToken as string;
  fetchPromise = null;
  return csrfToken;
}

/**
 * Returns the cached CSRF token, fetching one if necessary.
 */
export async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  // Deduplicate concurrent fetches
  if (!fetchPromise) {
    fetchPromise = fetchCsrfToken();
  }
  return fetchPromise;
}

/**
 * Drop-in replacement for fetch() that automatically attaches
 * the X-CSRF-Token header to state-changing requests (POST, PATCH, DELETE, PUT).
 *
 * If the server responds with 403 and a CSRF error code, the token is refreshed
 * and the request is retried exactly once.
 */
export async function csrfFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const method = (init?.method ?? "GET").toUpperCase();

  if (STATE_CHANGING_METHODS.includes(method)) {
    const token = await getCsrfToken();
    const headers = new Headers(init?.headers);
    headers.set("X-CSRF-Token", token);
    const response = await fetch(input, { ...init, headers });

    // If the token was rejected, refresh and retry once
    if (response.status === 403) {
      const body = await response.clone().json().catch(() => null);
      if (body?.code === "FORBIDDEN" && /csrf/i.test(body?.message ?? "")) {
        csrfToken = null;
        fetchPromise = null;
        const freshToken = await fetchCsrfToken();
        const retryHeaders = new Headers(init?.headers);
        retryHeaders.set("X-CSRF-Token", freshToken);
        return fetch(input, { ...init, headers: retryHeaders });
      }
    }

    return response;
  }

  return fetch(input, init);
}

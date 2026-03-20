"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { getCsrfToken } from "@/lib/client/csrf";

const CsrfContext = createContext<string | null>(null);

/**
 * Prefetches a CSRF token on mount so that the first state-changing request
 * (POST / PATCH / DELETE / PUT) does not have to wait for a round-trip.
 *
 * The token is also stored in the module-level cache inside `@/lib/client/csrf`,
 * so `csrfFetch` and `requestJson` will use it automatically.
 */
export function CsrfProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    getCsrfToken()
      .then(setToken)
      .catch(() => null);
  }, []);

  return <CsrfContext.Provider value={token}>{children}</CsrfContext.Provider>;
}

/**
 * Returns the current CSRF token (or null if not yet fetched).
 * Most code should prefer `csrfFetch` / `requestJson` which handle
 * the token automatically; this hook is for edge-cases where you need
 * direct access to the raw token value.
 */
export function useCsrfToken() {
  return useContext(CsrfContext);
}

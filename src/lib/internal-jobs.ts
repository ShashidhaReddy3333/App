import { unauthorizedError } from "@/lib/errors";
import { env, getOptionalCronSecret } from "@/lib/env";

export function assertInternalJobAuthorized(request: Request) {
  const expectedSecret = getOptionalCronSecret();
  if (!expectedSecret) {
    throw unauthorizedError("Internal job secret is not configured.");
  }

  const bearerToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? null;
  const headerToken = request.headers.get("x-cron-secret")?.trim() ?? null;
  const providedSecret = bearerToken || headerToken;

  if (!providedSecret || providedSecret !== expectedSecret) {
    throw unauthorizedError("Invalid internal job authorization.");
  }
}

export function getCronAuthHeader() {
  return `Bearer ${env.CRON_SECRET}`;
}

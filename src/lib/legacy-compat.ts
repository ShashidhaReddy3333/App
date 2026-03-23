type LegacyCompatibilityEvent = "legacy_portal_redirect_hit" | "legacy_api_endpoint_hit";

function getRequestHeader(request: Request, name: string) {
  return request.headers.get(name) ?? null;
}

export function getLegacyRequestMetadata(request: Request) {
  return {
    requestId: getRequestHeader(request, "x-request-id"),
    host: getRequestHeader(request, "host"),
    ipAddress: getRequestHeader(request, "x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: getRequestHeader(request, "user-agent"),
    referer: getRequestHeader(request, "referer"),
  };
}

export function logLegacyCompatibilityHit(
  event: LegacyCompatibilityEvent,
  metadata: Record<string, unknown>
) {
  console.warn(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "warn",
      event,
      category: "legacy_compatibility",
      ...metadata,
    })
  );
}

import { env } from "@/lib/env";

function normalizeBaseUrl() {
  return env.APP_URL.endsWith("/") ? env.APP_URL.slice(0, -1) : env.APP_URL;
}

export function getMetadataBase() {
  return new URL(normalizeBaseUrl());
}

export function getCanonicalPath(path: string) {
  if (path === "/") {
    return "/";
  }

  return path.startsWith("/") ? path : `/${path}`;
}

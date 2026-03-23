import { env } from "@/lib/env";
import { getCurrentRequestOrigin } from "@/lib/portal";

export async function getMetadataBase() {
  try {
    return new URL(await getCurrentRequestOrigin());
  } catch {
    return new URL(env.APP_URL.endsWith("/") ? env.APP_URL.slice(0, -1) : env.APP_URL);
  }
}

export function getCanonicalPath(path: string) {
  if (path === "/") {
    return "/";
  }

  return path.startsWith("/") ? path : `/${path}`;
}

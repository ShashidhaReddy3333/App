import type { Metadata } from "next";

import { env } from "@/lib/env";
import { getCurrentRequestOrigin } from "@/lib/portal";

export const NO_INDEX_ROBOTS: NonNullable<Metadata["robots"]> = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
  },
};

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

export function withNoIndex(metadata: Metadata): Metadata {
  return {
    ...metadata,
    robots: NO_INDEX_ROBOTS,
  };
}

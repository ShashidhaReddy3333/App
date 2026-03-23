import type { MetadataRoute } from "next";

import { getCurrentPortal, getCurrentRequestOrigin } from "@/lib/portal";
import { buildPortalRobots } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const [portal, origin] = await Promise.all([getCurrentPortal(), getCurrentRequestOrigin()]);

  return buildPortalRobots(portal, origin);
}

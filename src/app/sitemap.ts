import type { MetadataRoute } from "next";

import { getCurrentPortal, getCurrentRequestOrigin } from "@/lib/portal";
import { buildPortalSitemap } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [portal, origin] = await Promise.all([getCurrentPortal(), getCurrentRequestOrigin()]);

  return buildPortalSitemap(portal, origin);
}

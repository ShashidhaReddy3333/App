import type { MetadataRoute } from "next";

export type SeoPortal = "main" | "shop" | "retail" | "supply" | "admin";

const MAIN_SITEMAP_PATHS = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.4 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.4 },
] as const;

const SHOP_SITEMAP_PATHS = [
  { path: "/", changeFrequency: "weekly", priority: 0.9 },
  { path: "/shop", changeFrequency: "daily", priority: 0.9 },
  { path: "/marketplace", changeFrequency: "daily", priority: 0.8 },
] as const;

const RETAIL_SITEMAP_PATHS = [{ path: "/", changeFrequency: "weekly", priority: 0.7 }] as const;
const SUPPLY_SITEMAP_PATHS = [{ path: "/", changeFrequency: "weekly", priority: 0.7 }] as const;

function buildAbsoluteUrl(origin: string, path: string) {
  return new URL(path, origin).toString();
}

function getSitemapPathSet(portal: SeoPortal) {
  if (portal === "shop") {
    return SHOP_SITEMAP_PATHS;
  }

  if (portal === "retail") {
    return RETAIL_SITEMAP_PATHS;
  }

  if (portal === "supply") {
    return SUPPLY_SITEMAP_PATHS;
  }

  if (portal === "admin") {
    return [] as const;
  }

  return MAIN_SITEMAP_PATHS;
}

export function buildPortalRobots(portal: SeoPortal, origin: string): MetadataRoute.Robots {
  const sitemap = buildAbsoluteUrl(origin, "/sitemap.xml");

  if (portal === "admin") {
    return {
      host: new URL(origin).host,
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  if (portal === "shop") {
    return {
      host: new URL(origin).host,
      sitemap,
      rules: {
        userAgent: "*",
        allow: ["/", "/shop", "/shop/", "/marketplace", "/marketplace/"],
        disallow: [
          "/cart",
          "/orders",
          "/sign-in",
          "/sign-up",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
          "/api/",
          "/portal/",
          "/_surfaces/",
        ],
      },
    };
  }

  if (portal === "retail") {
    return {
      host: new URL(origin).host,
      sitemap,
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/onboarding",
          "/checkout",
          "/sales",
          "/orders",
          "/refunds",
          "/products",
          "/suppliers",
          "/reorder",
          "/procurement",
          "/reports",
          "/locations",
          "/staff",
          "/notifications",
          "/sessions",
          "/ops",
          "/accept-invite",
          "/forbidden",
          "/sign-in",
          "/sign-up",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
          "/api/",
          "/portal/",
          "/_surfaces/",
        ],
      },
    };
  }

  if (portal === "supply") {
    return {
      host: new URL(origin).host,
      sitemap,
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/catalog",
          "/orders",
          "/forbidden",
          "/sign-in",
          "/sign-up",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
          "/api/",
          "/portal/",
          "/_surfaces/",
        ],
      },
    };
  }

  return {
    host: new URL(origin).host,
    sitemap,
    rules: {
      userAgent: "*",
      allow: ["/", "/privacy", "/terms"],
      disallow: ["/sign-in", "/portal/", "/_surfaces/", "/api/"],
    },
  };
}

export function buildPortalSitemap(portal: SeoPortal, origin: string): MetadataRoute.Sitemap {
  return getSitemapPathSet(portal).map((entry) => ({
    url: buildAbsoluteUrl(origin, entry.path),
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}

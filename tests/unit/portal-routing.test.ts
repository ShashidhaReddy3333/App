import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { middleware } from "@/middleware";
import { getPortalLegacyRedirectForMainHost } from "@/lib/portal";

describe("legacy portal routing", () => {
  it("preserves only intentional main-host compatibility redirects", () => {
    expect(getPortalLegacyRedirectForMainHost("/sign-up")).toEqual({
      portal: "retail",
      path: "/sign-up",
    });
    expect(getPortalLegacyRedirectForMainHost("/accept-invite")).toEqual({
      portal: "retail",
      path: "/accept-invite",
    });
    expect(getPortalLegacyRedirectForMainHost("/customer/sign-up")).toEqual({
      portal: "shop",
      path: "/sign-up",
    });
  });

  it("does not apply main-host redirects inside dedicated portals", () => {
    expect(getPortalLegacyRedirectForMainHost("/sign-up", "shop")).toBeNull();
    expect(getPortalLegacyRedirectForMainHost("/sign-up", "supply")).toBeNull();
    expect(getPortalLegacyRedirectForMainHost("/customer/sign-up", "retail")).toBeNull();
  });

  it("does not redirect removed mixed-role main-host app paths", () => {
    expect(getPortalLegacyRedirectForMainHost("/dashboard")).toBeNull();
    expect(getPortalLegacyRedirectForMainHost("/shop")).toBeNull();
    expect(getPortalLegacyRedirectForMainHost("/supplier/dashboard")).toBeNull();
  });
});

describe("portal middleware", () => {
  it("rewrites dedicated portal sign-up paths without cross-redirecting to retail", () => {
    const scenarios = [
      {
        host: "shop.human-pulse.com",
        expectedRewrite: "https://shop.human-pulse.com/portal/shop/sign-up",
      },
      {
        host: "supply.human-pulse.com",
        expectedRewrite: "https://supply.human-pulse.com/portal/supply/sign-up",
      },
    ] as const;

    for (const scenario of scenarios) {
      const response = middleware(
        new NextRequest(`https://${scenario.host}/sign-up`, {
          headers: {
            host: scenario.host,
          },
        })
      );

      expect(response.headers.get("location")).toBeNull();
      expect(response.headers.get("x-middleware-rewrite")).toBe(scenario.expectedRewrite);
    }
  });

  it("keeps the main-host retail redirect for legacy /sign-up", () => {
    const response = middleware(
      new NextRequest("https://human-pulse.com/sign-up", {
        headers: {
          host: "human-pulse.com",
        },
      })
    );

    expect(response.headers.get("location")).toBe("https://retail.human-pulse.com/sign-up");
  });
});

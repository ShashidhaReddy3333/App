import { describe, expect, it } from "vitest";

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

  it("does not redirect removed mixed-role main-host app paths", () => {
    expect(getPortalLegacyRedirectForMainHost("/dashboard")).toBeNull();
    expect(getPortalLegacyRedirectForMainHost("/shop")).toBeNull();
    expect(getPortalLegacyRedirectForMainHost("/supplier/dashboard")).toBeNull();
  });
});

import { describe, expect, it } from "vitest";

import { buildPortalRobots, buildPortalSitemap } from "@/lib/seo";

function getFirstRule(robots: ReturnType<typeof buildPortalRobots>) {
  const rules = Array.isArray(robots.rules) ? robots.rules[0] : robots.rules;

  expect(rules).toBeDefined();

  return rules!;
}

describe("portal SEO helpers", () => {
  it("keeps the main marketing sitemap limited to the brand surface", () => {
    const sitemap = buildPortalSitemap("main", "https://human-pulse.com");

    expect(sitemap.map((entry) => entry.url)).toEqual([
      "https://human-pulse.com/",
      "https://human-pulse.com/privacy",
      "https://human-pulse.com/terms",
    ]);
  });

  it("disallows shop account routes while allowing public shopping routes", () => {
    const robots = buildPortalRobots("shop", "https://shop.human-pulse.com");
    const rules = getFirstRule(robots);

    expect(rules.allow).toContain("/shop");
    expect(rules.disallow).toContain("/orders");
    expect(rules.disallow).toContain("/sign-in");
    expect(robots.sitemap).toBe("https://shop.human-pulse.com/sitemap.xml");
  });

  it("blocks admin crawling completely", () => {
    const robots = buildPortalRobots("admin", "https://admin.human-pulse.com");
    const rules = getFirstRule(robots);

    expect(rules.disallow).toBe("/");
    expect(robots.sitemap).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";

import { formatBusinessDateStamp, getBusinessDayRange } from "@/lib/timezone";

describe("timezone helpers", () => {
  it("builds a business-day date stamp in the requested timezone", () => {
    const stamp = formatBusinessDateStamp("America/Toronto", new Date("2026-03-15T03:30:00.000Z"));
    expect(stamp).toBe("2026-03-14");
  });

  it("returns a day range with start before end", () => {
    const range = getBusinessDayRange("America/Toronto", new Date("2026-03-15T18:00:00.000Z"));
    expect(range.start.getTime()).toBeLessThan(range.end.getTime());
  });
});

import { describe, expect, it } from "vitest";
import { checkInCacheKey, mergeCloudCheckIns, pendingCheckInsKey } from "./checkInCacheHelpers";

describe("account-scoped check-in caching", () => {
  const a = "d80e6a4c-dc15-4c87-a2d5-ea70fd2ca21d";
  const b = "5fba63e7-1ddc-4228-9bdc-5416cb1167f5";
  it("separates cached data for each signed-in account", () => {
    expect(checkInCacheKey(a)).not.toBe(checkInCacheKey(b));
    expect(pendingCheckInsKey(a)).toContain(a);
    expect(() => checkInCacheKey(null)).toThrow();
  });
  it("uses cloud records except for unsynced local edits and keeps offline-only days", () => {
    const local = [
      { date: "2026-10-17", steps: 8000 },
      { date: "2026-10-16", steps: 9000 },
      { date: "2026-10-15", steps: 4000 },
    ];
    const remote = [
      { date: "2026-10-17", steps: 8500 },
      { date: "2026-10-16", steps: 7000 },
      { date: "2026-10-14", steps: 6500 },
    ];
    const result = mergeCloudCheckIns(local, remote, ["2026-10-16"]);
    expect(result.map((r) => [r.date,r.steps])).toEqual([
      ["2026-10-17", 8500],
      ["2026-10-16", 9000],
      ["2026-10-15", 4000],
      ["2026-10-14", 6500],
    ]);
  });
});

import { describe, expect, it } from "vitest";
import { nutritionCacheKey, mergeNutritionCache } from "./nutritionCacheHelpers";

const alice = "11111111-1111-4111-8111-111111111111";
const bob = "22222222-2222-4222-8222-222222222222";

describe("nutrition cache account separation", () => {
  it("has unique cache keys per authenticated account", () => {
    expect(nutritionCacheKey(alice)).not.toBe(nutritionCacheKey(bob));
    expect(() => nutritionCacheKey("")).toThrow(/signed-in/);
  });
  it("restores cloud meals from every fetched day, not just today", () => {
    const remote = [
      { id: "a", date: "2026-10-28", name: "Breakfast", createdAt: "2026-10-28T05:00:00Z" },
      { id: "b", date: "2026-10-27", name: "Dinner", createdAt: "2026-10-27T13:00:00Z" },
    ];
    expect(mergeNutritionCache(remote, [])).toEqual(remote);
  });
  it("keeps older cached meals but lets cloud overwrite the same ID", () => {
    const cached = [{ id: "a", name: "Stale" }, { id: "older", name: "Old but retained" }];
    const merged = mergeNutritionCache([{ id: "a", name: "Updated" }], cached);
    expect(merged).toHaveLength(2);
    expect(merged.find(x => x.id === "a").name).toBe("Updated");
    expect(merged.find(x => x.id === "older").name).toBe("Old but retained");
  });
});

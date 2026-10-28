import { describe, expect, it } from "vitest";
import { nutritionCacheKey, nutritionPendingKey, nutritionDeletionsKey, mergeNutritionCache, toNutritionCloudPayload, fromNutritionCloudRow } from "./nutritionCacheHelpers";

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
  it("retains pending local edits, hides offline deletions and avoids duplicates", () => {
    const old = [{ id: "m1", name: "Cloud old", createdAt: "2026-10-28T12:00:00Z" }];
    const newer = [{ id: "m1", name: "Local new", createdAt: "2026-10-28T12:00:00Z" }];
    expect(mergeNutritionCache(old, newer, ["m1"])).toEqual(newer);
    expect(mergeNutritionCache(old, newer, [])).toEqual(old);
    expect(mergeNutritionCache(old, newer, [], ["m1"])).toEqual([]);
  });
  it("uses a stable UUID for upserts, so failed requests can retry without duplicating", () => {
    const mealId = "33333333-3333-4333-8333-333333333333";
    const record = { id: mealId, date: "2026-10-27", type: "Dinner", name: "Chicken", calories: 625, protein: 45 };
    const payload = toNutritionCloudPayload(record, alice);
    expect(payload).toMatchObject({ id: mealId, user_id: alice, calories: 625, protein_g: 45, carbs_g: 0 });
    expect(nutritionPendingKey(alice)).not.toBe(nutritionPendingKey(bob));
    expect(nutritionDeletionsKey(alice)).toContain(alice);
    expect(() => toNutritionCloudPayload({ ...record, id: "invalid" }, alice)).toThrow();
    expect(fromNutritionCloudRow({ ...payload, created_at: "2026-10-27T01:00:00Z" }).id).toBe(mealId);
  });

});

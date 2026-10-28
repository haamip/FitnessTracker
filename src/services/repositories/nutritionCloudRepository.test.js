import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../supabase", () => ({ supabase: null }));
import { NutritionRepository } from "./trackfitDataLayer";
import { NutritionCloudRepository } from "./nutritionCloudRepository";

const alice = "11111111-1111-4111-8111-111111111111";
const bob = "22222222-2222-4222-8222-222222222222";
const meal = {
  id: "33333333-3333-4333-8333-333333333333",
  date: "2026-10-27", type: "Pre-shift meal", name: "Chicken dinner",
  calories: 625, protein: 45, carbs: 35, fats: 25,
};

describe("offline nutrition writes", () => {
  beforeEach(() => { localStorage.clear(); NutritionRepository.setActiveUser(alice); });
  afterEach(() => NutritionRepository.setActiveUser(null));

  it("saves meals offline, queues backup, and retains them after reopening", async () => {
    const result = await NutritionCloudRepository.save(meal);
    expect(result.cloudSaved).toBe(false);
    expect(NutritionRepository.getAll()[0]).toMatchObject(meal);
    expect(NutritionRepository.getPendingIds()).toEqual([meal.id]);
    await NutritionCloudRepository.retryPending();
    expect(NutritionRepository.getPendingIds()).toEqual([meal.id]);
    NutritionRepository.setActiveUser(bob);
    expect(NutritionCloudRepository.getCached()).toEqual([]);
    NutritionRepository.setActiveUser(alice);
    expect(NutritionRepository.getAll()).toHaveLength(1);
  });
  it("queues edits only once and keeps latest nutrition values", async () => {
    await NutritionCloudRepository.save(meal);
    await NutritionCloudRepository.save({ ...meal, calories: 650 });
    expect(NutritionRepository.getPendingIds()).toEqual([meal.id]);
    expect(NutritionRepository.getAll()[0].calories).toBe(650);
  });
  it("removes an offline meal and keeps the tombstone until cloud confirms", async () => {
    await NutritionCloudRepository.save(meal);
    const result = await NutritionCloudRepository.remove(meal.id);
    expect(result.cloudSaved).toBe(false);
    expect(NutritionRepository.getAll()).toEqual([]);
    expect(NutritionRepository.getPendingIds()).toEqual([]);
    expect(NutritionRepository.getDeletions()).toEqual([meal.id]);
  });
});

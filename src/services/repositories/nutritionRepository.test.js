import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../supabase", () => ({ supabase: null }));
import { NutritionRepository } from "./trackfitDataLayer";

const alice = "11111111-1111-4111-8111-111111111111";
const bob = "22222222-2222-4222-8222-222222222222";
const dinner = { id: "33333333-3333-4333-8333-333333333333", date: "2026-10-27", name: "Chicken dinner", calories: 625, protein: 45 };

describe("nutrition repository account-scoped device cache", () => {
  beforeEach(() => { localStorage.clear(); NutritionRepository.setActiveUser(alice); });
  afterEach(() => NutritionRepository.setActiveUser(null));

  it("never exposes Alice's meals after switching to Bob", () => {
    NutritionRepository.add(dinner);
    expect(NutritionRepository.getToday("2026-10-27")).toEqual([dinner]);
    NutritionRepository.setActiveUser(bob);
    expect(NutritionRepository.getAll()).toEqual([]);
    NutritionRepository.add({ ...dinner, id: "new-meal", name: "Lunch" });
    NutritionRepository.setActiveUser(alice);
    expect(NutritionRepository.getAll()).toEqual([dinner]);
  });
  it("does not automatically claim unowned legacy meal records", () => {
    localStorage.setItem("trackfit_nutrition", JSON.stringify([dinner]));
    expect(NutritionRepository.getAll()).toEqual([]);
    expect(NutritionRepository.getLegacyCount()).toBe(1);
    NutritionRepository.setActiveUser(bob);
    expect(NutritionRepository.getAll()).toEqual([]);
    expect(JSON.parse(localStorage.getItem("trackfit_nutrition"))).toEqual([dinner]);
  });
  it("deletes only the active account cache", () => {
    NutritionRepository.add(dinner);
    NutritionRepository.setActiveUser(bob);
    NutritionRepository.add({ ...dinner, id: "bob" });
    NutritionRepository.clear();
    NutritionRepository.setActiveUser(alice);
    expect(NutritionRepository.getAll()).toEqual([dinner]);
  });
});

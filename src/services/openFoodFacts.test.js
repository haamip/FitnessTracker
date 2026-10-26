import { describe, expect, it, vi } from "vitest";
import {
  getFoodByBarcode,
  isValidFoodBarcode,
  normaliseFoodProduct,
  scaleFoodNutrients,
  searchFoodByName,
} from "./openFoodFacts";

const example = {
  code: "9300675000385",
  product_name: "Example oats",
  brands: "Sample Brand",
  nutriments: {
    "energy-kcal_100g": 390,
    proteins_100g: 13,
    carbohydrates_100g: 66,
    fat_100g: 7,
  },
};

describe("Open Food Facts adapter", () => {
  it("only accepts a plausible numeric barcode", () => {
    expect(isValidFoodBarcode("9300675000385")).toBe(true);
    expect(isValidFoodBarcode("abc")).toBe(false);
    expect(isValidFoodBarcode("123")).toBe(false);
  });

  it("normalises per-100g nutrition and scales a serving", () => {
    const food = normaliseFoodProduct(example);
    expect(food.name).toBe("Example oats");
    expect(scaleFoodNutrients(food, 200)).toEqual({
      calories: "780", protein: "26", carbs: "132", fats: "14",
    });
  });

  it("preserves unknown nutrient values instead of inventing zero", () => {
    const food = normaliseFoodProduct({
      code: "12345678", product_name: "Unknown", nutriments: { proteins_100g: 4 },
    });
    expect(scaleFoodNutrients(food, 150)).toEqual({
      calories: "", protein: "6", carbs: "", fats: "",
    });
  });

  it("uses kJ only when the kcal value is absent", () => {
    const food = normaliseFoodProduct({
      code: "12345678", nutriments: { "energy-kj_100g": 418.4 },
    });
    expect(scaleFoodNutrients(food, 100).calories).toBe("100");
  });

  it("does not call the server for invalid barcodes", async () => {
    const request = vi.fn();
    await expect(getFoodByBarcode("oops", request)).rejects.toThrow(/barcode/i);
    expect(request).not.toHaveBeenCalled();
  });

  it("returns null when the barcode is not in the database", async () => {
    const request = vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ status: 0 }),
    });
    await expect(getFoodByBarcode("12345678", request)).resolves.toBeNull();
  });
  it("only searches on deliberate calls, normalises results and excludes duplicates", async () => {
    const request = vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ products: [example, example, { ...example, code: "12345678", product_name: "Oat biscuits" }] }),
    });
    const foods = await searchFoodByName("  oats  ", request);
    expect(foods).toHaveLength(2);
    expect(foods[0].per100g.protein).toBe(13);
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][0]).toContain("search_terms=oats");
    expect(request.mock.calls[0][0]).toContain("page_size=18");
  });
  it("requires meaningful search text and handles limited rate", async () => {
    const request = vi.fn();
    await expect(searchFoodByName("a", request)).rejects.toThrow(/3 characters/);
    expect(request).not.toHaveBeenCalled();
    request.mockResolvedValue({ status: 429, ok: false });
    await expect(searchFoodByName("milk", request)).rejects.toThrow(/busy/);
  });

});

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), invoke: vi.fn(), prepare: vi.fn() }));
vi.mock("../supabase", () => ({
  supabase: { auth: { getUser: mocks.getUser }, functions: { invoke: mocks.invoke } },
}));
vi.mock("./mealEstimateClient", () => ({
  validateMealPhoto: vi.fn((file) => file),
  prepareNutritionLabelPhoto: mocks.prepare,
}));
import { readNutritionLabel } from "./nutritionLabelClient";

describe("AI nutrition label transcription", () => {
  const file = new File(["photo"], "nutrition.jpg", { type: "image/jpeg" });
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "signed-in" } }, error: null });
    mocks.prepare.mockResolvedValue("data:image/jpeg;base64,dGVzdA==");
  });
  it("sends a compressed label only when requested and never saves it", async () => {
    mocks.invoke.mockResolvedValue({ data: {
      mode: "live", basis: "per100g", productName: "Noodles", brand: "Brand",
      calories: 415, protein: 12, carbs: 68, fats: 8.7,
      notes: "Read from per 100g column", needsReview: true,
    }, error: null });
    const result = await readNutritionLabel({ file });
    expect(mocks.invoke).toHaveBeenCalledWith("trackfit-label-read", {
      body: { image: "data:image/jpeg;base64,dGVzdA==" },
    });
    expect(result).toMatchObject({ calories: 415, carbs: 68, needsReview: true });
  });
  it("refuses requests without an account", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(readNutritionLabel({ file })).rejects.toThrow(/Sign into TrackFit/);
    expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it("preserves unknown macro values as null", async () => {
    mocks.invoke.mockResolvedValue({ data: {
      mode: "live", basis: "unavailable", productName: "", brand: "",
      calories: null, protein: null, carbs: null, fats: null, notes: "Only per 100 mL", needsReview: true,
    }, error: null });
    const result = await readNutritionLabel({ file });
    expect(result.calories).toBeNull();
    expect(result.protein).toBeNull();
  });
});

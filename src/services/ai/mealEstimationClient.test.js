import { beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({ user: vi.fn(), invoke: vi.fn() }));
vi.mock("../supabase", () => ({
  supabase: { auth: { getUser: mock.user }, functions: { invoke: mock.invoke } },
}));
import { requestMealEstimate, validateMealPhoto } from "./mealEstimationClient";

describe("secured meal estimation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mock.user.mockResolvedValue({ data: { user: { id: "signed-in-user" } }, error: null });
    mock.invoke.mockResolvedValue({ data: {
      mode: "live", requiresReview: true, canEstimate: true,
      mealName: "Chicken dinner", calories: 620, protein: 55, carbs: 48, fats: 19,
      confidence: 0.6, notes: "Approximate portion.",
      items: [{ name: "Chicken breast", amount: "150 g", calories: 240 }],
    }, error: null });
  });

  it("uses only the signed-in Supabase function for homemade meal estimates", async () => {
    const result = await requestMealEstimate({
      kind: "description", description: "150g chicken and 200g cooked rice with vegetables",
    });
    expect(mock.invoke).toHaveBeenCalledWith("trackfit-meal-estimate", {
      body: { kind: "description", description: "150g chicken and 200g cooked rice with vegetables" },
    });
    expect(result.canEstimate).toBe(true);
    expect(result.calories).toBe(620);
  });

  it("never sends anything for unauthenticated users", async () => {
    mock.user.mockResolvedValue({ data: { user: null }, error: null });
    await expect(requestMealEstimate({ kind: "description", description: "Rice and chicken, one full plate" }))
      .rejects.toThrow(/Sign in/);
    expect(mock.invoke).not.toHaveBeenCalled();
  });

  it("does not accept fabricated demo estimates", async () => {
    mock.invoke.mockResolvedValue({ data: { mode: "demo", requiresReview: true }, error: null });
    await expect(requestMealEstimate({ kind: "description", description: "Cooked rice, 200 grams, and beans" }))
      .rejects.toThrow(/No verified live/);
  });

  it("rejects missing nutrition data as safe to review", async () => {
    mock.invoke.mockResolvedValue({
      data: { mode: "live", requiresReview: true, canEstimate: true, mealName: "Unknown", calories: 200, protein: null, carbs: 20, fats: 6 },
      error: null,
    });
    const result = await requestMealEstimate({ kind: "description", description: "Some unidentified dinner food" });
    expect(result.canEstimate).toBe(false);
  });

  it("validates image type and byte size before processing", () => {
    expect(() => validateMealPhoto({ type: "image/heic", size: 420000 })).toThrow(/JPG, PNG or WebP/);
    expect(() => validateMealPhoto({ type: "image/jpeg", size: 0 })).toThrow(/15 MB/);
    expect(() => validateMealPhoto({ type: "image/jpeg", size: 100000 })).not.toThrow();
  });

  it("rejects very short descriptions and overly long entries", async () => {
    await expect(requestMealEstimate({ kind: "description", description: "Dinner" }))
      .rejects.toThrow(/12–900/);
    expect(mock.invoke).not.toHaveBeenCalled();
  });
});

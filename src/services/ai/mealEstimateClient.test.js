import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), invoke: vi.fn() }));
vi.mock("../supabase", () => ({
  supabase: {
    auth: { getUser: mocks.getUser },
    functions: { invoke: mocks.invoke },
  },
}));
import { estimateMeal, prepareMealPhoto } from "./mealEstimateClient";

describe("secure meal estimator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "signed-in" } }, error: null });
  });
  it("sends a homemade recipe as plain text and never saves it automatically", async () => {
    mocks.invoke.mockResolvedValue({ data: {
      mode: "live", mealName: "Chicken and rice", calories: 620, protein: 42,
      carbs: 60, fats: 12, items: [], assumptions: "Assumed 1 cup rice", needsReview: true,
    }, error: null });
    const result = await estimateMeal({ description: "150 g chicken breast and 1 cup rice" });
    expect(mocks.invoke).toHaveBeenCalledWith("trackfit-meal-estimate", {
      body: { mode: "text", description: "150 g chicken breast and 1 cup rice" },
    });
    expect(result.calories).toBe(620);
    expect(result.needsReview).toBe(true);
  });
  it("does not request AI without an authenticated account", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(estimateMeal({ description: "Some chicken with rice" })).rejects.toThrow(/Sign into TrackFit/);
    expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it("does not substitute zero for unknown nutrients", async () => {
    mocks.invoke.mockResolvedValue({ data: {
      mode: "live", mealName: "Unknown dish", calories: null, protein: null,
      carbs: 15, fats: null, items: [], assumptions: "Unknown oil", needsReview: true,
    }, error: null });
    const result = await estimateMeal({ description: "Large homemade curry with unspecified ingredients" });
    expect(result.calories).toBeNull();
    expect(result.protein).toBeNull();
  });
  it("shows function errors rather than fabricated macros", async () => {
    mocks.invoke.mockResolvedValue({ data: null, error: { context: {
      json: async () => ({ error: "Daily AI limit reached." }),
    } } });
    await expect(estimateMeal({ description: "Chicken, potatoes and carrots" })).rejects.toThrow(/Daily AI limit/);
  });
  it("validates photo format before attempting to decode or upload", async () => {
    await expect(prepareMealPhoto(new Blob(["not a picture"], { type: "text/plain" })))
      .rejects.toThrow(/JPEG, PNG or WebP/);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), invoke: vi.fn() }));
vi.mock("../supabase", () => ({
  supabase: {
    auth: { getUser: mocks.getUser },
    functions: { invoke: mocks.invoke },
  },
}));
import { estimateMeal, prepareMealPhoto, validateMealPhoto, MAX_MEAL_PHOTO_BYTES } from "./mealEstimateClient";

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

  it("accepts a camera JPEG bigger than the old 8 MB limit and uploads only a compressed JPEG", async () => {
    const close = vi.fn();
    const bitmap = { width: 4000, height: 3000, close };
    const decode = vi.fn().mockResolvedValue(bitmap);
    vi.stubGlobal("createImageBitmap", decode);
    const drawImage = vi.fn();
    const context = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage });
    const jpeg = vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/jpeg;base64,dGVzdA==");
    const original = new File([new Uint8Array(9 * 1024 * 1024)], "dinner.jpg", { type: "image/jpeg" });
    mocks.invoke.mockResolvedValue({ data: {
      mode: "live", mealName: "Dinner", calories: 500, protein: 30, carbs: 45, fats: 18,
      items: [], assumptions: "Approximate portion", needsReview: true,
    }, error: null });
    const progress = vi.fn();
    try {
      const response = await estimateMeal({ file: original, description: "Chicken and vegetables", onProgress: progress });
      expect(response.mealName).toBe("Dinner");
      const [, payload] = mocks.invoke.mock.calls[0];
      expect(payload.body.mode).toBe("photo");
      expect(payload.body.image).toBe("data:image/jpeg;base64,dGVzdA==");
      expect(drawImage).toHaveBeenCalledOnce();
      expect(jpeg).toHaveBeenCalledOnce();
      expect(close).toHaveBeenCalledOnce();
      expect(progress.mock.calls.map(([message]) => message)).toEqual([
        "Preparing your photo on this phone...", "Sending photo for AI analysis...",
      ]);
    } finally {
      context.mockRestore();
      jpeg.mockRestore();
      vi.unstubAllGlobals();
    }
  });

  it("allows camera files with no MIME type, while rejecting empty and overlarge files", () => {
    const cameraPhoto = new File(["image bytes"], "camera.jpg", { type: "" });
    expect(validateMealPhoto(cameraPhoto)).toBe(cameraPhoto);
    expect(MAX_MEAL_PHOTO_BYTES).toBe(25 * 1024 * 1024);
    expect(() => validateMealPhoto(new File([], "empty.jpg", { type: "image/jpeg" }))).toThrow(/empty/);
    const huge = new File(["x"], "huge.jpg", { type: "image/jpeg" });
    Object.defineProperty(huge, "size", { value: 26 * 1024 * 1024 });
    expect(() => validateMealPhoto(huge)).toThrow(/25 MB/);
  });

  it("validates photo format before attempting to decode or upload", async () => {
    await expect(prepareMealPhoto(new Blob(["not a picture"], { type: "text/plain" })))
      .rejects.toThrow(/JPEG, PNG or WebP/);
  });
});

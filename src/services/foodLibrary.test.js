import { describe, expect, it } from "vitest";
import { validateSubmittedProduct } from "./foodLibrary";

describe("submitted TrackFit packaged foods", () => {
  const good = { barcode: "9300000000001", name: "Noodles", brand: "Test", calories: "220", protein: "6", carbs: "40", fats: "3" };
  it("keeps submitted products pending review", () => {
    expect(validateSubmittedProduct(good)).toMatchObject({ barcode: good.barcode, status: "pending", calories_100g: 220, protein_100g: 6 });
  });
  it("requires valid barcode and sensible label values", () => {
    expect(() => validateSubmittedProduct({ ...good, barcode: "nope" })).toThrow(/barcode/);
    expect(() => validateSubmittedProduct({ ...good, protein: "-5" })).toThrow(/Protein/);
    expect(() => validateSubmittedProduct({ ...good, calories: "" })).toThrow(/Calories/);
  });
  it("treats blank optional macros as unknown, never zero", () => {
    expect(validateSubmittedProduct({ ...good, carbs: "", fats: "" })).toMatchObject({ carbs_100g: null, fats_100g: null });
  });
});
import { describe, expect, it } from "vitest";
import { FOOD_BARCODE_FORMATS, readFoodBarcode } from "./foodBarcodeScanner";

describe("camera food barcode handling", () => {
  it("prefers standard supermarket barcodes", () => {
    expect(FOOD_BARCODE_FORMATS).toContain("ean_13");
    expect(FOOD_BARCODE_FORMATS).toContain("upc_a");
    expect(readFoodBarcode([
      { rawValue: "not food" },
      { rawValue: " 9300675000385 ", format: "ean_13" },
    ])).toBe("9300675000385");
  });

  it("ignores QR links and invalid short numbers", () => {
    expect(readFoodBarcode([
      { rawValue: "https://example.org" },
      { rawValue: "123" },
      { rawValue: "123456789012345678" },
    ])).toBe("");
    expect(readFoodBarcode(null)).toBe("");
  });

  it("preserves valid leading zeros", () => {
    expect(readFoodBarcode([{ rawValue: "012345678901" }])).toBe("012345678901");
  });
});

/** Only food-product EAN/UPC/ITF codes should be sent to the food database. */
export const FOOD_BARCODE_FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "itf"];

export function readFoodBarcode(detections) {
  for (const detection of detections || []) {
    const code = String(detection?.rawValue || "").trim();
    if (/^\d{8,14}$/.test(code)) return code;
  }
  return "";
}

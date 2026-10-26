/** Branded food lookups from the community-maintained Open Food Facts database. */
/** Data source: Open Food Facts, ODbL — https://world.openfoodfacts.org/ */
const fields = "code,product_name,brands,nutriments";
const barcodePattern = /^\d{8,14}$/;

function nonNegative(value) {
  if (value === null || value === undefined || value === "") return null;
  const result = Number(value);
  return Number.isFinite(result) && result >= 0 ? result : null;
}

export function isValidFoodBarcode(value) {
  return barcodePattern.test(String(value || "").trim());
}

export function normaliseFoodProduct(product) {
  if (!product || !product.code) return null;
  const nutrients = product.nutriments || {};
  const kilojoules = nonNegative(nutrients["energy-kj_100g"]);
  const directCalories = nonNegative(nutrients["energy-kcal_100g"]);
  return {
    barcode: String(product.code),
    name: String(product.product_name || "Unnamed product").trim(),
    brand: String(product.brands || "").trim(),
    sourceUrl: `https://world.openfoodfacts.org/product/${encodeURIComponent(product.code)}`,
    per100g: {
      calories: directCalories ?? (kilojoules === null ? null : kilojoules / 4.184),
      protein: nonNegative(nutrients.proteins_100g),
      carbs: nonNegative(nutrients.carbohydrates_100g),
      fats: nonNegative(nutrients.fat_100g),
    },
  };
}

export async function getFoodByBarcode(barcode, request = fetch) {
  const code = String(barcode || "").trim();
  if (!isValidFoodBarcode(code)) {
    throw new Error("Enter a valid 8–14 digit barcode.");
  }
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${fields}`;
  const response = await request(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Food database unavailable. Try again later.");
  const result = await response.json();
  return result.status === 1 ? normaliseFoodProduct(result.product) : null;
}

export function scaleFoodNutrients(food, grams) {
  const amount = Number(grams);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10000) {
    throw new Error("Enter an amount between 1 and 10,000 grams.");
  }
  const multiplier = amount / 100;
  return Object.fromEntries(
    Object.entries(food.per100g).map(([key, value]) => [
      key,
      value === null ? "" : String(Number((value * multiplier).toFixed(1))),
    ]),
  );
}

/**
 * Open Food Facts supports plain-text searches only through its legacy v1
 * endpoint at present. Call on explicit submission; search rate limit is
 * 10/min/IP, so never query on every keystroke.
 */
export async function searchFoodByName(query, request = fetch) {
  const term = String(query || "").trim().replace(/\\s+/g, " ");
  if (term.length < 3) throw new Error("Enter at least 3 characters to search foods.");
  if (term.length > 70) throw new Error("Search terms must be under 70 characters.");
  const parameters = new URLSearchParams({
    search_terms: term, search_simple: "1", action: "process", json: "1",
    page_size: "18", fields,
  });
  const url = `https://world.openfoodfacts.org/cgi/search.pl?${parameters}`;
  const response = await request(url, { headers: { Accept: "application/json" } });
  if (response.status === 429) throw new Error("Food database is busy. Please wait before searching again.");
  if (!response.ok) throw new Error("Could not search the food database. Try again later.");
  const payload = await response.json();
  const items = Array.isArray(payload?.products) ? payload.products : [];
  const seen = new Set();
  return items.map(normaliseFoodProduct)
    .filter((food) => {
      if (!food || !food.name || food.name === "Unnamed product" || seen.has(food.barcode)) return false;
      seen.add(food.barcode);
      return true;
    })
    .slice(0, 18);
}

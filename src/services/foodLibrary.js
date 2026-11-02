import { supabase } from "./supabase";
import { isValidFoodBarcode } from "./openFoodFacts";

const fields = "barcode,name,brand,calories_100g,protein_100g,carbs_100g,fats_100g,status";

function normaliseProduct(row) {
  return {
    barcode: row.barcode,
    name: row.name,
    brand: row.brand || "",
    sourceUrl: null,
    source: "trackfit",
    reviewStatus: row.status,
    per100g: {
      calories: Number(row.calories_100g),
      protein: Number(row.protein_100g),
      carbs: row.carbs_100g == null ? null : Number(row.carbs_100g),
      fats: row.fats_100g == null ? null : Number(row.fats_100g),
    },
  };
}

export async function getLibraryFoodByBarcode(value) {
  const barcode = String(value || "").trim();
  if (!isValidFoodBarcode(barcode) || !supabase) return null;
  const { data, error } = await supabase.from("food_products")
    .select(fields).eq("barcode", barcode).limit(20);
  if (error) throw error;
  const product = (data || []).find((item) => item.status === "approved")
    || (data || []).find((item) => item.status === "pending");
  return product ? normaliseProduct(product) : null;
}

/** Search the shared approved catalogue (and the signed-in user's own pending entries).
 * Two scoped queries avoid unsafe PostgREST filter-string interpolation.
 */
export async function searchFoodLibrary(value) {
  const term = String(value || "").trim().replace(/[^\p{L}\p{N}\s.'-]/gu, "").slice(0, 65);
  if (term.length < 3 || !supabase) return [];
  const pattern = `%${term.replace(/\s+/g, " ")}%`;
  const lookups = await Promise.all([
    supabase.from("food_products").select(fields).ilike("name", pattern).limit(18),
    supabase.from("food_products").select(fields).ilike("brand", pattern).limit(18),
  ]);
  const rows = [];
  for (const result of lookups) {
    if (result.error) throw result.error;
    rows.push(...(result.data || []));
  }
  const products = new Map();
  for (const row of rows) {
    const previous = products.get(row.barcode);
    if (!previous || (row.status === "approved" && previous.status !== "approved")) {
      products.set(row.barcode, row);
    }
  }
  return [...products.values()].slice(0, 18).map(normaliseProduct);
}

function numberInRange(value, max, label, allowEmpty = false) {
  if (allowEmpty && (value === "" || value === null || value === undefined)) return null;
  if (value === "" || value === null || value === undefined) throw new Error(`Enter ${label} per 100 g.`);
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > max) {
    throw new Error(`${label} per 100 g must be between 0 and ${max}.`);
  }
  return number;
}

export function validateSubmittedProduct(input) {
  const barcode = String(input?.barcode || "").trim();
  if (!isValidFoodBarcode(barcode)) throw new Error("Scan or enter an 8–14 digit barcode.");
  const name = String(input?.name || "").trim();
  const brand = String(input?.brand || "").trim();
  if (!name || name.length > 120) throw new Error("Enter a product name under 120 characters.");
  if (brand.length > 80) throw new Error("Brand must be under 80 characters.");
  return {
    barcode, name, brand,
    calories_100g: numberInRange(input.calories, 1000, "Calories"),
    protein_100g: numberInRange(input.protein, 100, "Protein"),
    carbs_100g: numberInRange(input.carbs, 100, "Carbohydrates", true),
    fats_100g: numberInRange(input.fats, 100, "Fat", true),
    status: "pending",
  };
}

/** Users see their own submissions. The rest become shared only after review. */
export async function submitFoodForReview(input) {
  if (!supabase) throw new Error("Sign in to submit packaged food.");
  const payload = validateSubmittedProduct(input);
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth?.user?.id) throw new Error("Sign in to submit packaged food.");
  const { error } = await supabase.from("food_products")
    .insert({ ...payload, submitted_by: auth.user.id });
  if (error) throw new Error("Couldn't add that product. Please try again or log the meal manually.");
  return normaliseProduct(payload);
}

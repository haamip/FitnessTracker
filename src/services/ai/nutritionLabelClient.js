import { supabase } from "../supabase";
import { prepareNutritionLabelPhoto, validateMealPhoto } from "./mealEstimateClient";

const nutrient = (value, max) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= max ? value : null;

export async function readNutritionLabel({ file, onProgress } = {}) {
  validateMealPhoto(file);
  if (!supabase) throw new Error("TrackFit is unable to connect to your account.");
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user || user.is_anonymous) throw new Error("Sign into TrackFit to read a nutrition label.");

  onProgress?.("Preparing your nutrition label photo...");
  const image = await prepareNutritionLabelPhoto(file);
  onProgress?.("Reading label with AI...");
  const { data, error } = await supabase.functions.invoke("trackfit-label-read", {
    body: { image },
  });
  if (error) {
    let message = "";
    try { const payload = await error.context?.json(); message = typeof payload?.error === "string" ? payload.error : ""; }
    catch { /* network errors may not include a JSON body */ }
    throw new Error(message || "Couldn't read the label. Check your connection or enter values manually.");
  }
  if (data?.mode !== "live" || !["per100g", "derivedFromServing", "unavailable"].includes(data.basis)) {
    throw new Error("AI did not return a usable label reading. Enter the numbers manually.");
  }
  return {
    productName: String(data.productName || "").slice(0, 120),
    brand: String(data.brand || "").slice(0, 80),
    basis: data.basis,
    calories: nutrient(data.calories, 1000),
    protein: nutrient(data.protein, 100),
    carbs: nutrient(data.carbs, 100),
    fats: nutrient(data.fats, 100),
    notes: String(data.notes || "").slice(0, 500),
    needsReview: true,
  };
}

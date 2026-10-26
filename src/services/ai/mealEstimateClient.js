import { supabase } from "../supabase";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_DATA_URL_LENGTH = 2_200_000;

function imageDimensions(image) {
  return { width: image.width || image.naturalWidth, height: image.height || image.naturalHeight };
}

async function decodeImage(file) {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    return { image: bitmap, close: () => bitmap.close() };
  }
  const url = URL.createObjectURL(file);
  try {
    const photo = new Image();
    photo.src = url;
    await photo.decode();
    return { image: photo, close: () => URL.revokeObjectURL(url) };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

/** Never upload the original full-resolution photo. Resize in browser memory. */
export async function prepareMealPhoto(file) {
  if (!(file instanceof Blob)) throw new Error("Choose a meal photo.");
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Choose a JPEG, PNG or WebP photo. HEIC photos may need converting to JPEG first.");
  }
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Photo is too large. Choose one under 8 MB.");
  let decoded;
  try { decoded = await decodeImage(file); }
  catch { throw new Error("Couldn't read that image. Try taking a new JPEG photo."); }
  try {
    const { width, height } = imageDimensions(decoded.image);
    if (!width || !height) throw new Error("Invalid image dimensions.");
    const scale = Math.min(1, 1100 / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Photo processing isn't available in this browser.");
    ctx.drawImage(decoded.image, 0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL("image/jpeg", 0.72);
    if (!data.startsWith("data:image/jpeg;base64,") || data.length > MAX_DATA_URL_LENGTH) {
      throw new Error("Compressed photo is too large. Try a smaller image.");
    }
    return data;
  } finally { decoded.close(); }
}

/** Explicit opt-in: send a compressed photo or a short homemade recipe to an authenticated Edge Function. */
export async function estimateMeal({ file, description = "" }) {
  if (!supabase) throw new Error("TrackFit account connection is unavailable.");
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user || user.is_anonymous) throw new Error("Sign into TrackFit to use the meal estimator.");
  const details = String(description).trim().slice(0, 700);
  const body = file
    ? { mode: "photo", image: await prepareMealPhoto(file), description: details }
    : { mode: "text", description: details };
  if (!file && details.length < 8) throw new Error("Describe your homemade meal and approximate portions.");
  const { data, error } = await supabase.functions.invoke("trackfit-meal-estimate", { body });
  if (error) {
    let message = "";
    try { const payload = await error.context?.json(); message = typeof payload?.error === "string" ? payload.error : ""; }
    catch { /* network error without JSON */ }
    throw new Error(message || "Meal AI isn't available right now. Use manual food logging.");
  }
  if (data?.mode !== "live" || typeof data.mealName !== "string") {
    throw new Error("Meal AI did not return a usable estimate.");
  }
  // Enforce null instead of inventing missing nutrients.
  const nutrient = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
  return {
    mode: "live",
    mealName: data.mealName.slice(0, 100),
    calories: nutrient(data.calories),
    protein: nutrient(data.protein),
    carbs: nutrient(data.carbs),
    fats: nutrient(data.fats),
    items: Array.isArray(data.items) ? data.items.slice(0, 6).map((item) => ({
      name: String(item.name || "").slice(0, 65),
      amount: String(item.amount || "").slice(0, 65),
      calories: nutrient(item.calories),
    })) : [],
    assumptions: String(data.assumptions || "").slice(0, 500),
    needsReview: Boolean(data.needsReview),
  };
}

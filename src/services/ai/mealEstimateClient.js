import { supabase } from "../supabase";

// Phone cameras frequently produce originals >8 MB. Only the resized JPEG goes
// over the network, and the server keeps its much smaller payload limit.
export const MAX_MEAL_PHOTO_BYTES = 25 * 1024 * 1024;
const MAX_DATA_URL_LENGTH = 2_200_000;

export function validateMealPhoto(file) {
  if (!(file instanceof Blob)) throw new Error("Take or choose a meal photo first.");
  if (!file.size) throw new Error("That photo is empty. Try taking it again.");
  if (file.size > MAX_MEAL_PHOTO_BYTES) {
    throw new Error("Photo is over 25 MB. Choose a smaller photo or reduce camera resolution.");
  }
  const type = (file.type || "").toLowerCase();
  // Some Android camera intents return an empty MIME type for legitimate images.
  const namedImage = !type && /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name || "");
  if (!type.startsWith("image/") && !namedImage) {
    throw new Error("Choose a photo, not another file. JPEG, PNG or WebP work best.");
  }
  return file;
}

function imageDimensions(image) {
  return { width: image.width || image.naturalWidth, height: image.height || image.naturalHeight };
}

async function decodeImage(file) {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return { image: bitmap, close: () => bitmap.close() };
    } catch {
      // Android WebViews can fail createImageBitmap for camera-produced images.
      // Try the HTML image decoder before giving up.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const photo = new Image();
    if (typeof photo.decode === "function") {
      photo.src = url;
      await photo.decode();
    } else {
      await new Promise((resolve, reject) => {
        photo.onload = resolve;
        photo.onerror = () => reject(new Error("Image could not be decoded."));
        photo.src = url;
      });
    }
    return { image: photo, close: () => URL.revokeObjectURL(url) };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

/** Never upload the original full-resolution photo. Resize in browser memory. */
export async function prepareMealPhoto(file) {
  validateMealPhoto(file);
  let decoded;
  try { decoded = await decodeImage(file); }
  catch { throw new Error("This phone could not read the photo. Try a JPEG photo, lower camera resolution, or use a screenshot."); }
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
export async function estimateMeal({ file, description = "", onProgress } = {}) {
  if (!supabase) throw new Error("TrackFit account connection is unavailable.");
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user || user.is_anonymous) throw new Error("Sign into TrackFit to use the meal estimator.");
  const details = String(description).trim().slice(0, 700);
  if (!file && details.length < 8) throw new Error("Describe your homemade meal and approximate portions.");
  if (file) onProgress?.("Preparing your photo on this phone...");
  const body = file
    ? { mode: "photo", image: await prepareMealPhoto(file), description: details }
    : { mode: "text", description: details };
  onProgress?.(file ? "Sending photo for AI analysis..." : "Analysing your recipe...");
  const { data, error } = await supabase.functions.invoke("trackfit-meal-estimate", { body });
  if (error) {
    let message = "";
    try { const payload = await error.context?.json(); message = typeof payload?.error === "string" ? payload.error : ""; }
    catch { /* network error without JSON */ }
    if (!message && error.context?.status === 413) message = "Photo was too large to send. Try a smaller image.";
    if (!message && /fetch|network/i.test(String(error.message || ""))) {
      message = "Couldn't reach the meal estimator. Check your connection and try again.";
    }
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

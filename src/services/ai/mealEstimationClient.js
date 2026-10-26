import { supabase } from "../supabase";

const MAX_INPUT_BYTES = 15 * 1024 * 1024;
const MAX_IMAGE_DATA_LENGTH = 1_650_000;
const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Accept supported image files only; no photos persist on the device or server. */
export function validateMealPhoto(file) {
  if (!file || !IMAGE_MIMES.has(file.type)) {
    throw new Error("Choose a JPG, PNG or WebP meal photo. HEIC photos need converting first.");
  }
  if (!Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_INPUT_BYTES) {
    throw new Error("Choose a photo under 15 MB.");
  }
  return true;
}

/** Reduce mobile camera images before sending, keeping OpenAI API costs bounded. */
export async function compressMealPhoto(file) {
  validateMealPhoto(file);
  let image;
  let objectUrl;
  try {
    if (typeof createImageBitmap === "function") {
      image = await createImageBitmap(file);
    } else {
      objectUrl = URL.createObjectURL(file);
      image = await new Promise((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error("Could not decode photo. Try a JPG image."));
        element.src = objectUrl;
      });
    }
    const width = image.width;
    const height = image.height;
    if (!width || !height) throw new Error("Could not read the selected photo.");
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This device cannot prepare a meal photo.");
    for (const longest of [1100, 860, 640]) {
      const scale = Math.min(1, longest / Math.max(width, height));
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.8, 0.65]) {
        const result = canvas.toDataURL("image/jpeg", quality);
        if (result.length <= MAX_IMAGE_DATA_LENGTH) return result;
      }
    }
    throw new Error("This photo is still too large. Retake it at a lower resolution.");
  } finally {
    if (typeof image?.close === "function") image.close();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

function messageFromError(error) {
  if (error?.context?.json) {
    return error.context.json().then((body) =>
      typeof body?.error === "string" ? body.error : "Meal AI is unavailable. Please try again."
    ).catch(() => "Meal AI is unavailable. Please try again.");
  }
  return Promise.resolve("Meal AI is unavailable. Please try again.");
}

/** The API key remains exclusively in Supabase Edge Function secrets. */
export async function requestMealEstimate(input) {
  if (!supabase) throw new Error("Connect your TrackFit account before using Meal AI.");
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user || user.is_anonymous) throw new Error("Sign in to TrackFit before using Meal AI.");

  let body;
  if (input?.kind === "photo") {
    body = { kind: "photo", image: await compressMealPhoto(input.file) };
  } else if (input?.kind === "description") {
    const description = String(input.description || "").trim();
    if (description.length < 12 || description.length > 900) {
      throw new Error("Describe the meal, ingredients and approximate serving size (12–900 characters).");
    }
    body = { kind: "description", description };
  } else throw new Error("Choose a photo or describe your meal.");

  const { data, error } = await supabase.functions.invoke("trackfit-meal-estimate", { body });
  if (error) throw new Error(await messageFromError(error));
  if (data?.mode !== "live" || !data?.requiresReview) {
    throw new Error("No verified live AI meal estimate was returned.");
  }
  const normaliseMetric = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
  const result = {
    mode: "live",
    canEstimate: data.canEstimate === true,
    mealName: String(data.mealName || "Meal estimate").slice(0, 100),
    calories: normaliseMetric(data.calories),
    protein: normaliseMetric(data.protein),
    carbs: normaliseMetric(data.carbs),
    fats: normaliseMetric(data.fats),
    confidence: Math.max(0, Math.min(1, Number(data.confidence) || 0)),
    notes: String(data.notes || "").slice(0, 360),
    source: body.kind,
    items: Array.isArray(data.items) ? data.items.slice(0, 5).map((item) => ({
      name: String(item.name || "").slice(0, 80),
      amount: String(item.amount || "").slice(0, 60),
      calories: normaliseMetric(item.calories),
    })) : [],
  };
  if ([result.calories, result.protein, result.carbs, result.fats].some((value) => value === null)) {
    result.canEstimate = false;
  }
  return result;
}

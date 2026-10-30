import { supabase } from "./supabase";

const BUCKET = "trackfit-beta-feedback";
const ALLOWED = new Map([["image/jpeg","jpg"],["image/png","png"],["image/webp","webp"]]);
const LIMIT_BYTES = 5 * 1024 * 1024;
const CATEGORIES = new Set(["Bug", "Suggestion", "Question", "Other"]);

export function validateFeedback({ category, description, files = [] }) {
  const message = String(description || "").trim();
  if (!CATEGORIES.has(category)) throw new Error("Choose a feedback category.");
  if (message.length < 10 || message.length > 3000) throw new Error("Tell us what happened in 10–3,000 characters.");
  if (!Array.isArray(files) || files.length > 3) throw new Error("Attach no more than three screenshots.");
  for (const file of files) {
    if (!ALLOWED.has(file.type) || !file.size || file.size > LIMIT_BYTES)
      throw new Error("Screenshots must be JPEG, PNG or WebP, each smaller than 5 MB.");
  }
  return { category, description: message, files };
}

async function getAccount() {
  if (!supabase) throw new Error("TrackFit isn't connected. Sign in and try again.");
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user || data.user.is_anonymous) throw new Error("Sign in to submit beta feedback.");
  return data.user.id;
}

export async function submitBetaFeedback(payload) {
  const { category, description, files } = validateFeedback(payload);
  const userId = await getAccount();
  const feedbackId = crypto.randomUUID();
  const paths = [];
  try {
    for (const file of files) {
      const path = userId + "/" + feedbackId + "/" + crypto.randomUUID() + "." + ALLOWED.get(file.type);
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600", contentType: file.type, upsert: false,
      });
      if (error) throw error;
      paths.push(path);
    }
    if (await getAccount() !== userId) throw new Error("Your TrackFit account changed. Sign back in to submit feedback.");
    const { data, error } = await supabase.from("beta_feedback").insert({
      id: feedbackId, user_id: userId, category, description, screenshot_paths: paths,
    }).select("id,created_at").single();
    if (error) throw error;
    if (!data?.id) throw new Error("Feedback wasn't confirmed. Try again.");
    return data;
  } catch (error) {
    // Best-effort cleanup if screenshot uploaded but the feedback row failed.
    if (paths.length) await supabase.storage.from(BUCKET).remove(paths).catch(() => {});
    throw error;
  }
}

export async function getMyBetaFeedback() {
  const userId = await getAccount();
  const { data, error } = await supabase.from("beta_feedback")
    .select("id,category,description,created_at")
    .eq("user_id", userId).order("created_at", { ascending:false }).limit(5);
  if (error) throw error;
  if (await getAccount() !== userId) return [];
  return data || [];
}

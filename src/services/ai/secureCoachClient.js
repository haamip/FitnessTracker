import { compactCoachChatHistory } from "./coachChatHistory";
import { supabase } from "../supabase";

/**
 * On-demand only. Supabase sends the signed-in session JWT; no AI key
 * or raw fitness diary/photo is ever placed in the browser bundle.
 */
export async function requestTrackFitCoach(kind, details = {}) {
  if (!["daily", "weekly", "chat"].includes(kind)) throw new Error("Unsupported coaching request.");
  if (!supabase) throw new Error("TrackFit account connection is unavailable.");
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user || user.is_anonymous) throw new Error("Sign into TrackFit to use AI Coach.");
  const body = { kind };
  if (kind === "chat") {
    const question = String(details.question || "").trim().slice(0, 700);
    if (!question) throw new Error("Enter a question for your coach.");
    body.question = question;
    body.history = compactCoachChatHistory(details.history);
  }
  if (kind === "weekly") {
    const allowed = ["nutrition", "steps", "cardio", "progression", "recovery", "note"];
    const answers = {};
    for (const key of allowed) {
      answers[key] = String(details.answers?.[key] || "").trim().slice(0, key === "note" ? 500 : 35);
    }
    body.answers = answers;
  }
  const { data, error } = await supabase.functions.invoke("trackfit-coach", { body });
  if (error) {
    let detail = "";
    try { const payload = await error.context?.json(); detail = typeof payload?.error === "string" ? payload.error : ""; }
    catch { /* Offline responses may not contain JSON. */ }
    throw new Error(detail || "Live AI Coach is unavailable. Your regular TrackFit coaching still works.");
  }
  if (data?.mode !== "live" || typeof data.summary !== "string" || !data.summary.trim()) {
    throw new Error("AI Coach did not return a verified live response.");
  }
  return {
    mode: "live",
    headline: String(data.headline || "Your TrackFit Coach").slice(0, 100),
    summary: data.summary.slice(0, 750),
    actions: Array.isArray(data.actions) ? data.actions.slice(0, 3).map((x) => String(x).slice(0, 190)) : [],
    answer: String(data.answer || data.summary).slice(0, 1100),
    dataScope: String(data.dataScope || "Synced account records").slice(0, 100),
  };
}

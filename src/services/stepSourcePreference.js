import { supabase } from "./supabase";

export const STEP_SOURCE_ALL = "all";
export const STEP_SOURCE_SAMSUNG = "samsung_health";

const prefKey = (userId) => `trackfit_step_source_${userId}`;

export function normaliseStepSourceMode(mode) {
  return mode === STEP_SOURCE_SAMSUNG ? STEP_SOURCE_SAMSUNG : STEP_SOURCE_ALL;
}

export function getStepSourceMode(userId) {
  if (!userId || typeof localStorage === "undefined") return STEP_SOURCE_ALL;
  return normaliseStepSourceMode(localStorage.getItem(prefKey(userId)));
}

export function setStepSourceMode(userId, mode) {
  if (!userId) throw new Error("Sign in to choose a step source.");
  const selected = normaliseStepSourceMode(mode);
  localStorage.setItem(prefKey(userId), selected);
  window.dispatchEvent(new CustomEvent("trackfit:step-source-changed", { detail: { sourceMode: selected } }));
  return selected;
}

export async function getCurrentStepSourceMode() {
  if (!supabase) return STEP_SOURCE_ALL;
  const { data, error } = await supabase.auth.getUser();
  return error ? STEP_SOURCE_ALL : getStepSourceMode(data?.user?.id);
}

export function stepSourceName(mode) {
  return normaliseStepSourceMode(mode) === STEP_SOURCE_SAMSUNG ? "Samsung Health" : "Health Connect combined";
}

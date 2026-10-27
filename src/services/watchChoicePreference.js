import { STEP_SOURCE_ALL, STEP_SOURCE_SAMSUNG } from "./stepSourcePreference";

const WATCHES = ["samsung", "pixel_fitbit", "garmin", "polar", "other", "apple", "none"];

export function normaliseWatchChoice(choice) {
  return WATCHES.includes(choice) ? choice : "";
}

export function initialWatchChoice(savedChoice, stepSourceMode) {
  return normaliseWatchChoice(savedChoice) || (stepSourceMode === STEP_SOURCE_SAMSUNG ? "samsung" : "");
}

export function watchStepSource(choice) {
  return choice === "samsung" ? STEP_SOURCE_SAMSUNG : STEP_SOURCE_ALL;
}

export function getWatchChoice(userId) {
  if (!userId || typeof localStorage === "undefined") return "";
  return normaliseWatchChoice(localStorage.getItem(`trackfit_watch_choice_${userId}`));
}

export function setWatchChoice(userId, choice) {
  if (!userId) throw new Error("Sign in to save your watch.");
  const selected = normaliseWatchChoice(choice);
  if (!selected) throw new Error("Choose a supported watch option.");
  localStorage.setItem(`trackfit_watch_choice_${userId}`, selected);
  return selected;
}

import { readJson, writeJson } from "../utils/storage";

const SHIFT_MODE_KEY = "trackfit_shift_mode";
export const SHIFT_MODE_EVENT = "trackfit:shift-mode-changed";

export function getShiftMode() {
  return readJson(SHIFT_MODE_KEY, "day") === "night" ? "night" : "day";
}

export function setShiftMode(mode) {
  const next = mode === "night" ? "night" : "day";
  writeJson(SHIFT_MODE_KEY, next);
  window.dispatchEvent(new CustomEvent(SHIFT_MODE_EVENT, { detail: { mode: next } }));
  return next;
}

export function toggleShiftMode() {
  return setShiftMode(getShiftMode() === "night" ? "day" : "night");
}

/**
 * A night shift crosses midnight, so entries made after midnight and before noon
 * still belong to the shift that started on the previous calendar day.
 */
export function getOperationalDate(date = new Date(), mode = getShiftMode()) {
  const adjusted = new Date(date);
  if (mode === "night" && adjusted.getHours() < 12) adjusted.setDate(adjusted.getDate() - 1);
  return adjusted.toLocaleDateString("en-CA");
}

export function getShiftMealTypes(mode = getShiftMode()) {
  return mode === "night"
    ? ["Pre-shift meal", "Night smoko", "Main break", "Morning smoko", "Post-shift meal", "Shake"]
    : ["Breakfast", "Morning smoko", "Lunch", "Afternoon smoko", "Dinner", "Shake"];
}

export function describeShift(mode = getShiftMode()) {
  return mode === "night"
    ? { mode: "night", label: "Night shift", activeWindow: "18:00-06:00", operationalDayRule: "Before noon counts toward the previous shift day" }
    : { mode: "day", label: "Day shift", activeWindow: "06:00-18:00", operationalDayRule: "Uses the current calendar day" };
}

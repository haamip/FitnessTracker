import { readJson, writeJson } from "../utils/storage";

const SHIFT_MODE_KEY = "trackfit_shift_mode";
const NIGHT_START_KEY = "trackfit_night_shift_start";
export const SHIFT_MODE_EVENT = "trackfit:shift-mode-changed";
const DEFAULT_NIGHT_START = "18:00";

const isValidTime = (value) => typeof value === "string" &&
  /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

function localDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function getShiftMode() {
  return readJson(SHIFT_MODE_KEY, "day") === "night" ? "night" : "day";
}

export function getShiftStartTime() {
  const saved = readJson(NIGHT_START_KEY, DEFAULT_NIGHT_START);
  return isValidTime(saved) ? saved : DEFAULT_NIGHT_START;
}

export function setShiftStartTime(value) {
  if (!isValidTime(value)) throw new Error("Choose a valid shift start time.");
  writeJson(NIGHT_START_KEY, value);
  window.dispatchEvent(new CustomEvent(SHIFT_MODE_EVENT, { detail: { mode: getShiftMode(), shiftStartTime: value } }));
  return value;
}

export function setShiftMode(mode) {
  const next = mode === "night" ? "night" : "day";
  writeJson(SHIFT_MODE_KEY, next);
  window.dispatchEvent(new CustomEvent(SHIFT_MODE_EVENT, { detail: { mode: next, shiftStartTime: getShiftStartTime() } }));
  return next;
}

export function toggleShiftMode() {
  return setShiftMode(getShiftMode() === "night" ? "day" : "night");
}

/**
 * The operational date is the date the reporting window starts.
 * Day: midnight to midnight. Night: configured start to the following start.
 * Use the device's local timezone to align with Android Health Connect.
 */
export function getOperationalDate(date = new Date(), mode = getShiftMode(), shiftStartTime = getShiftStartTime()) {
  const adjusted = new Date(date);
  if (mode === "night") {
    const [hour, minute] = (isValidTime(shiftStartTime) ? shiftStartTime : DEFAULT_NIGHT_START).split(":").map(Number);
    if (adjusted.getHours() * 60 + adjusted.getMinutes() < hour * 60 + minute) {
      adjusted.setDate(adjusted.getDate() - 1);
    }
  }
  return localDateKey(adjusted);
}

export function getShiftMealTypes(mode = getShiftMode()) {
  return mode === "night"
    ? ["Pre-shift meal", "Night smoko", "Main break", "Morning smoko", "Post-shift meal", "Shake"]
    : ["Breakfast", "Morning smoko", "Lunch", "Afternoon smoko", "Dinner", "Shake"];
}

export function describeShift(mode = getShiftMode()) {
  const start = getShiftStartTime();
  return mode === "night"
    ? { mode: "night", label: "Night shift", activeWindow: `${start} to ${start} next day`, operationalDayRule: `Starts at ${start} local time` }
    : { mode: "day", label: "Day shift", activeWindow: "00:00 to 00:00 next day", operationalDayRule: "Uses the current calendar day" };
}

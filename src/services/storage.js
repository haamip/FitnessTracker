/**
 * Small localStorage helper used by TrackFit's offline-first features.
 *
 * Keeping JSON parsing in one place prevents every page from repeating the same
 * try/catch block and makes corrupted local data fail safely instead of
 * crashing the app during a workout.
 */
export function readJson(key, fallback) {
  const saved = localStorage.getItem(key);

  if (!saved) return fallback;

  try {
    return JSON.parse(saved);
  } catch {
    return fallback;
  }
}

/**
 * Writes a value to localStorage as JSON.
 *
 * The app currently runs offline-first, so localStorage is our lightweight
 * database until we add user accounts/cloud sync later.
 */
export function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

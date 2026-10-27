/**
 * Wall-clock-based workout duration. Browser/Android WebView intervals pause
 * while a tab is hidden, but elapsed time from a stable start timestamp does not.
 * One timer per signed-in user and workout ID; navigation never resets it.
 */
const KEY_PREFIX = "trackfit_workout_clock:";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function workoutClockKey(userId, workoutId) {
  if (!UUID.test(String(userId || "")) || !String(workoutId || "").trim()) {
    throw new Error("A signed-in account and workout are required for timing.");
  }
  return `${KEY_PREFIX}${userId}:${encodeURIComponent(String(workoutId))}`;
}

export function elapsedWorkoutSeconds(startedAt, now = Date.now()) {
  const start = Number(startedAt);
  if (!Number.isFinite(start) || start <= 0 || !Number.isFinite(now) || now < start) return 0;
  return Math.floor((now - start) / 1000);
}

export function getOrStartWorkoutClock(userId, workoutId, now = Date.now()) {
  const key = workoutClockKey(userId, workoutId);
  const recorded = Number(localStorage.getItem(key));
  // Respect a previously saved start, but reject invalid or future timestamps.
  if (Number.isFinite(recorded) && recorded > 0 && recorded <= now) return recorded;
  localStorage.setItem(key, String(now));
  return now;
}

export function clearWorkoutClock(userId, workoutId) {
  if (!userId || !workoutId) return;
  localStorage.removeItem(workoutClockKey(userId, workoutId));
}

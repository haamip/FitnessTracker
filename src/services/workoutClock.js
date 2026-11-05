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

/** Read an existing clock without starting one just by opening a workout. */
export function readWorkoutClock(userId, workoutId, now = Date.now()) {
  const recorded = Number(localStorage.getItem(workoutClockKey(userId, workoutId)));
  return Number.isFinite(recorded) && recorded > 0 && recorded <= now ? recorded : null;
}

/**
 * Recover old sessions, but don't count yesterday's accidental preview as a
 * workout. Logged sets are never discarded and their clocks stay recoverable.
 */
export function getResumableWorkoutClock(userId, workoutId, hasLoggedSets = false, now = Date.now()) {
  const recorded = readWorkoutClock(userId, workoutId, now);
  if (recorded && !hasLoggedSets && now - recorded > 12 * 60 * 60 * 1000) {
    clearWorkoutClock(userId, workoutId);
    return null;
  }
  return recorded;
}

export function getOrStartWorkoutClock(userId, workoutId, now = Date.now()) {
  const recorded = readWorkoutClock(userId, workoutId, now);
  if (recorded !== null) return recorded;
  localStorage.setItem(workoutClockKey(userId, workoutId), String(now));
  return now;
}

export function clearWorkoutClock(userId, workoutId) {
  if (!userId || !workoutId) return;
  localStorage.removeItem(workoutClockKey(userId, workoutId));
}

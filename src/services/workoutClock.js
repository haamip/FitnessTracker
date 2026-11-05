/**
 * Wall-clock-based workout duration. Browser/Android WebView intervals pause
 * while a tab is hidden, but elapsed time from a stable start timestamp does not.
 * One timer per signed-in user and workout ID; navigation never resets it.
 */
const KEY_PREFIX = "trackfit_workout_clock:";
export const MAX_WORKOUT_SECONDS = 2 * 60 * 60;
const EXTENDED_CLOCK_SUFFIX = ":two-hour-confirmed";
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

export function hasConfirmedLongWorkout(userId, workoutId, startedAt) {
  if (!startedAt) return false;
  return Number(localStorage.getItem(workoutClockKey(userId, workoutId) + EXTENDED_CLOCK_SUFFIX)) === startedAt;
}

export function confirmLongWorkout(userId, workoutId, startedAt) {
  if (!startedAt) return;
  localStorage.setItem(workoutClockKey(userId, workoutId) + EXTENDED_CLOCK_SUFFIX, String(startedAt));
}

export function correctWorkoutClock(userId, workoutId, minutes, now = Date.now()) {
  if (!Number.isInteger(minutes) || minutes < 1 || minutes >= 120) {
    throw new Error("Workout minutes must be between 1 and 119.");
  }
  const startedAt = now - minutes * 60_000;
  localStorage.setItem(workoutClockKey(userId, workoutId), String(startedAt));
  localStorage.removeItem(workoutClockKey(userId, workoutId) + EXTENDED_CLOCK_SUFFIX);
  return startedAt;
}

export function getWorkoutClockSeconds(startedAt, confirmed = false, now = Date.now()) {
  const elapsed = elapsedWorkoutSeconds(startedAt, now);
  return confirmed ? elapsed : Math.min(elapsed, MAX_WORKOUT_SECONDS);
}

export function needsWorkoutTimeReview(startedAt, confirmed = false, now = Date.now()) {
  return Boolean(startedAt) && !confirmed && elapsedWorkoutSeconds(startedAt, now) >= MAX_WORKOUT_SECONDS;
}

export function clearWorkoutClock(userId, workoutId) {
  if (!userId || !workoutId) return;
  const key = workoutClockKey(userId, workoutId);
  localStorage.removeItem(key);
  localStorage.removeItem(key + EXTENDED_CLOCK_SUFFIX);
}

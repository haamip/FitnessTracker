/**
 * TrackFit Data Layer v1.
 *
 * These repositories are the single local data access point for the app while
 * TrackFit is offline-first. Screens should call repositories instead of
 * reading localStorage directly so future Firebase/Supabase migration stays
 * boring, predictable and clean.
 */
import { readJson, writeJson } from "./storage";

const WORKOUT_KEY_PREFIX = "trackfit_workout_";
const WORKOUT_HISTORY_KEY = "trackfit_workout_history";
const CHECKINS_KEY = "trackfit_checkins";
const CARDIO_KEY = "trackfit_cardio";
const AI_PLAN_KEY = "trackfit_ai_workout_plan";

function removeJson(key) {
  localStorage.removeItem(key);
}

function newestFirst(left, right) {
  return new Date(right.completedAt || right.date || 0) - new Date(left.completedAt || left.date || 0);
}

/** Handles editable workout sessions keyed by workout/template id. */
export const WorkoutRepository = {
  getById(workoutId) {
    return readJson(`${WORKOUT_KEY_PREFIX}${workoutId}`, []);
  },

  saveById(workoutId, workout) {
    writeJson(`${WORKOUT_KEY_PREFIX}${workoutId}`, workout);
  },

  removeById(workoutId) {
    removeJson(`${WORKOUT_KEY_PREFIX}${workoutId}`);
  },
};

/** Handles completed workout history records. */
export const HistoryRepository = {
  getAll() {
    return readJson(WORKOUT_HISTORY_KEY, []).sort(newestFirst);
  },

  getRecent(limit = 6) {
    return this.getAll().slice(0, limit);
  },

  saveAll(history) {
    writeJson(WORKOUT_HISTORY_KEY, history);
  },

  add(record) {
    const history = [record, ...this.getAll()];
    this.saveAll(history);
    return history;
  },

  clear() {
    removeJson(WORKOUT_HISTORY_KEY);
  },
};

/** Handles generated smart training plans. */
export const AIPlanRepository = {
  getPlan() {
    return readJson(AI_PLAN_KEY, []);
  },

  savePlan(plan) {
    writeJson(AI_PLAN_KEY, plan);
  },

  clear() {
    removeJson(AI_PLAN_KEY);
  },
};

/** Handles logged cardio sessions. */
export const CardioRepository = {
  getAll() {
    return readJson(CARDIO_KEY, []).sort(newestFirst);
  },

  saveAll(cardio) {
    writeJson(CARDIO_KEY, cardio);
  },

  clear() {
    removeJson(CARDIO_KEY);
  },
};

/** Handles daily wellness and nutrition check-ins. */
export const CheckInRepository = {
  getAll() {
    return readJson(CHECKINS_KEY, []).sort(newestFirst);
  },

  saveAll(checkIns) {
    writeJson(CHECKINS_KEY, checkIns);
  },

  clear() {
    removeJson(CHECKINS_KEY);
  },
};

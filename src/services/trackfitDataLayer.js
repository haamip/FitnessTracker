/**
 * TrackFit Data Layer v1.
 *
 * Repositories are the single local data access point while TrackFit is
 * offline-first. Pages should not touch localStorage directly.
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
  return (
    new Date(right.completedAt || right.date || 0) -
    new Date(left.completedAt || left.date || 0)
  );
}

export const WorkoutRepository = {
  getById(workoutId) {
    return readJson(`${WORKOUT_KEY_PREFIX}${workoutId}`, null);
  },

  saveById(workoutId, workout) {
    writeJson(`${WORKOUT_KEY_PREFIX}${workoutId}`, workout);
  },

  removeById(workoutId) {
    removeJson(`${WORKOUT_KEY_PREFIX}${workoutId}`);
  },
};

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

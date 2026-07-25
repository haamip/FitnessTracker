/**
 * TrackFit Data Layer v1.
 *
 * Repositories are the single local data access point while TrackFit is
 * offline-first. Pages should not touch localStorage directly.
 */
import { readJson, writeJson } from "../utils/storage";

const WORKOUT_KEY_PREFIX = "trackfit_workout_";
const SAVED_WORKOUTS_KEY = "trackfit_saved_workouts";
const WORKOUT_HISTORY_KEY = "trackfit_workout_history";
const CHECKINS_KEY = "trackfit_checkins";
const CARDIO_KEY = "trackfit_cardio";
const NUTRITION_KEY = "trackfit_nutrition";
const AI_PLAN_KEY = "trackfit_ai_workout_plan";

function removeJson(key) {
  localStorage.removeItem(key);
}

function newestFirst(left, right) {
  return (
    new Date(right.completedAt || right.updatedAt || right.date || 0) -
    new Date(left.completedAt || left.updatedAt || left.date || 0)
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

export const SavedWorkoutRepository = {
  getAll() {
    return readJson(SAVED_WORKOUTS_KEY, []).sort(newestFirst);
  },

  saveAll(workouts) {
    writeJson(SAVED_WORKOUTS_KEY, workouts);
  },

  save(workout) {
    const current = this.getAll().filter((item) => item.id !== workout.id);
    const next = [{ ...workout, updatedAt: new Date().toISOString() }, ...current];
    this.saveAll(next);
    return next;
  },

  remove(workoutId) {
    const next = this.getAll().filter((item) => item.id !== workoutId);
    this.saveAll(next);
    WorkoutRepository.removeById(workoutId);
    return next;
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

  update(recordId, changes) {
    const history = this.getAll().map((record) =>
      record.id === recordId ? { ...record, ...changes } : record,
    );
    this.saveAll(history);
    return history.find((record) => record.id === recordId) || null;
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

export const NutritionRepository = {
  getAll() {
    return readJson(NUTRITION_KEY, []).sort(newestFirst);
  },

  getToday(date = new Date().toISOString().slice(0, 10)) {
    return this.getAll().filter((meal) => meal.date === date);
  },

  saveAll(meals) {
    writeJson(NUTRITION_KEY, meals);
  },

  add(meal) {
    const meals = [meal, ...this.getAll()];
    this.saveAll(meals);
    return meals;
  },

  clear() {
    removeJson(NUTRITION_KEY);
  },
};
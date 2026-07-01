import { readJson, writeJson } from "../services/storage";

/**
 * TrackFit local data repositories.
 *
 * This is the first proper data layer for the app. Pages should use these
 * repositories instead of talking to localStorage directly. Later, these same
 * functions can be backed by Firebase/Supabase without rewriting every screen.
 */

export const TRACKFIT_KEYS = {
  aiWorkoutPlan: "trackfit_ai_workout_plan",
  cardio: "trackfit_cardio",
  checkins: "trackfit_checkins",
  workoutHistory: "trackfit_workout_history",
};

export function getWorkoutStorageKey(workoutId) {
  return `trackfit_workout_${workoutId}`;
}

function sortByNewest(items, dateKey) {
  return [...items].sort((a, b) => new Date(b[dateKey] || 0) - new Date(a[dateKey] || 0));
}

export const AIPlanRepository = {
  getPlan() {
    return readJson(TRACKFIT_KEYS.aiWorkoutPlan, []);
  },

  savePlan(plan) {
    writeJson(TRACKFIT_KEYS.aiWorkoutPlan, plan);
    return plan;
  },

  clearPlan() {
    localStorage.removeItem(TRACKFIT_KEYS.aiWorkoutPlan);
  },
};

export const WorkoutRepository = {
  getWorkout(workoutId, fallback = null) {
    return readJson(getWorkoutStorageKey(workoutId), fallback);
  },

  saveWorkout(workoutId, workout) {
    writeJson(getWorkoutStorageKey(workoutId), workout);
    return workout;
  },

  clearWorkout(workoutId) {
    localStorage.removeItem(getWorkoutStorageKey(workoutId));
  },

  getWorkoutFromPlan(workoutId) {
    return AIPlanRepository.getPlan().find((day) => day.id === workoutId) || null;
  },
};

export const HistoryRepository = {
  getHistory() {
    return sortByNewest(readJson(TRACKFIT_KEYS.workoutHistory, []), "completedAt");
  },

  getRecent(limit = 6) {
    return this.getHistory().slice(0, limit);
  },

  saveHistory(history) {
    writeJson(TRACKFIT_KEYS.workoutHistory, history);
    return history;
  },

  addCompletedWorkout(workout) {
    const nextHistory = [workout, ...this.getHistory()];
    return this.saveHistory(nextHistory);
  },

  findById(historyId) {
    return this.getHistory().find((workout) => workout.id === historyId) || null;
  },

  clearHistory() {
    localStorage.removeItem(TRACKFIT_KEYS.workoutHistory);
  },
};

export const CardioRepository = {
  getCardio() {
    return sortByNewest(readJson(TRACKFIT_KEYS.cardio, []), "date");
  },

  saveCardio(cardio) {
    writeJson(TRACKFIT_KEYS.cardio, cardio);
    return cardio;
  },

  clearCardio() {
    localStorage.removeItem(TRACKFIT_KEYS.cardio);
  },
};

export const CheckInRepository = {
  getCheckIns() {
    return sortByNewest(readJson(TRACKFIT_KEYS.checkins, []), "date");
  },

  saveCheckIns(checkins) {
    writeJson(TRACKFIT_KEYS.checkins, checkins);
    return checkins;
  },

  clearCheckIns() {
    localStorage.removeItem(TRACKFIT_KEYS.checkins);
  },
};
import { readJson, writeJson } from "../utils/storage";
import { supabase } from "../supabase";
import { TrainingCloudRepository } from "./trainingCloudRepository";

const WORKOUT_KEY_PREFIX = "trackfit_workout_";
const SAVED_WORKOUTS_KEY = "trackfit_saved_workouts";
const WORKOUT_HISTORY_KEY = "trackfit_workout_history";
const CHECKINS_KEY = "trackfit_checkins";
const CARDIO_KEY = "trackfit_cardio";
const NUTRITION_KEY = "trackfit_nutrition";
const AI_PLAN_KEY = "trackfit_ai_workout_plan";

function removeJson(key) { localStorage.removeItem(key); }
function newestFirst(left, right) { return new Date(right.completedAt || right.updatedAt || right.date || 0) - new Date(left.completedAt || left.updatedAt || left.date || 0); }
function syncQuietly(action) { Promise.resolve(action).catch((error) => console.warn("TrackFit cloud sync deferred:", error)); }
function toNumber(value) { const number = Number.parseFloat(value); return Number.isFinite(number) ? number : 0; }

async function syncCompletedWorkout(record) {
  if (!supabase) return;
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    const userId = userData.user?.id;
    if (!userId) return;
    const completedAt = record.completedAt || new Date().toISOString();
    const durationSeconds = Number(record.durationSeconds ?? record.seconds) || 0;
    const startedAt = new Date(new Date(completedAt).getTime() - durationSeconds * 1000).toISOString();
    const { data, error } = await supabase.from("workout_sessions").insert({
      user_id: userId,
      title: record.title || "Completed workout",
      status: "completed",
      started_at: startedAt,
      completed_at: completedAt,
      duration_seconds: durationSeconds,
      exercises: record.exercises || [],
      total_volume: Number(record.volume) || 0,
      notes: record.notes || null,
      prs: record.prs || [],
      completed_sets: Number(record.completedSets ?? record.doneSets) || 0,
      total_sets: Number(record.totalSets) || 0,
    }).select("id").single();
    if (error) throw error;
    if (data?.id) {
      const current = readJson(WORKOUT_HISTORY_KEY, []);
      writeJson(WORKOUT_HISTORY_KEY, current.map((item) => item.id === record.id ? { ...item, id: data.id } : item));
    }
  } catch (error) {
    console.warn("Workout cloud save failed; session remains stored locally.", error);
  }
}

async function syncDailyCheckIn(record) {
  if (!supabase || !record?.date) return;

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    const userId = userData.user?.id;
    if (!userId) return;

    const payload = {
      user_id: userId,
      checkin_date: record.date,
      weight_kg: toNumber(record.weightKg ?? record.weight),
      protein_g: toNumber(record.proteinG ?? record.protein),
      water_l: toNumber(record.waterL ?? record.water),
      sleep_hours: toNumber(record.sleepHours ?? record.sleep),
      mood: record.mood || "Okay",
      energy: Math.round(toNumber(record.energy ?? 5)),
      body_feel: record.bodyFeel || record.soreness || "Mild",
      trained_today: Boolean(record.trainedToday ?? record.trained === true || record.trained === "Yes"),
      training_note: record.trainingNote || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("daily_checkins")
      .upsert(payload, { onConflict: "user_id,checkin_date" })
      .select("*")
      .single();

    if (error) throw error;

    if (data?.id) {
      const current = readJson(CHECKINS_KEY, []);
      writeJson(
        CHECKINS_KEY,
        current.map((item) => item.date === record.date ? { ...item, id: data.id } : item),
      );
    }

    window.dispatchEvent(new CustomEvent("trackfit:checkin-saved", { detail: { date: record.date } }));
  } catch (error) {
    console.warn("Daily check-in cloud save failed; check-in remains cached locally.", error);
  }
}

function freshWorkoutCopy(exercises = []) {
  return exercises.map((exercise) => ({
    ...exercise,
    id: `${exercise.libraryId || exercise.id || "exercise"}-${crypto.randomUUID()}`,
    sets: (exercise.sets || []).map((set) => ({ ...set, id: crypto.randomUUID(), done: false, rpe: "", rir: "", failure: false, note: "" })),
  }));
}

export const WorkoutRepository = {
  getById(workoutId) {
    const activeWorkout = readJson(`${WORKOUT_KEY_PREFIX}${workoutId}`, null);
    if (activeWorkout) return activeWorkout;
    const template = readJson(SAVED_WORKOUTS_KEY, []).find((workout) => workout.id === workoutId);
    return template?.exercises ? freshWorkoutCopy(template.exercises) : null;
  },
  saveById(workoutId, workout) {
    writeJson(`${WORKOUT_KEY_PREFIX}${workoutId}`, workout);
    syncQuietly(TrainingCloudRepository.saveActiveWorkout(workoutId, workout));
  },
  removeById(workoutId) {
    removeJson(`${WORKOUT_KEY_PREFIX}${workoutId}`);
    syncQuietly(TrainingCloudRepository.removeActiveWorkout(workoutId));
  },
};

export const SavedWorkoutRepository = {
  getAll() { return readJson(SAVED_WORKOUTS_KEY, []).sort(newestFirst); },
  getById(workoutId) { return this.getAll().find((workout) => workout.id === workoutId) || null; },
  saveAll(workouts) {
    writeJson(SAVED_WORKOUTS_KEY, workouts);
    workouts.forEach((workout) => syncQuietly(TrainingCloudRepository.saveTemplate(workout)));
  },
  save(workout) {
    const current = this.getAll().filter((item) => item.id !== workout.id);
    const next = [{ ...workout, updatedAt: new Date().toISOString() }, ...current];
    writeJson(SAVED_WORKOUTS_KEY, next);
    syncQuietly(TrainingCloudRepository.saveTemplate(next[0]));
    return next;
  },
  createSession(workoutId) {
    const template = this.getById(workoutId);
    if (!template?.exercises) return null;
    const session = freshWorkoutCopy(template.exercises);
    WorkoutRepository.saveById(workoutId, session);
    return session;
  },
  remove(workoutId) {
    const next = this.getAll().filter((item) => item.id !== workoutId);
    writeJson(SAVED_WORKOUTS_KEY, next);
    WorkoutRepository.removeById(workoutId);
    syncQuietly(TrainingCloudRepository.deleteTemplate(workoutId));
    return next;
  },
};

export const HistoryRepository = {
  getAll() { return readJson(WORKOUT_HISTORY_KEY, []).sort(newestFirst); },
  getRecent(limit = 6) { return this.getAll().slice(0, limit); },
  saveAll(history) { writeJson(WORKOUT_HISTORY_KEY, history); },
  add(record) {
    const history = [record, ...this.getAll().filter((item) => item.id !== record.id)];
    this.saveAll(history);
    void syncCompletedWorkout(record);
    return history;
  },
  update(recordId, changes) {
    const history = this.getAll().map((record) => record.id === recordId ? { ...record, ...changes } : record);
    this.saveAll(history);
    return history.find((record) => record.id === recordId) || null;
  },
  clear() { removeJson(WORKOUT_HISTORY_KEY); },
};

export const AIPlanRepository = {
  getPlan() { return readJson(AI_PLAN_KEY, []); },
  savePlan(plan) { writeJson(AI_PLAN_KEY, plan); syncQuietly(TrainingCloudRepository.savePlan(plan)); },
  clear() { removeJson(AI_PLAN_KEY); syncQuietly(TrainingCloudRepository.clearPlan()); },
};

export const CardioRepository = { getAll() { return readJson(CARDIO_KEY, []).sort(newestFirst); }, saveAll(cardio) { writeJson(CARDIO_KEY, cardio); }, clear() { removeJson(CARDIO_KEY); } };
export const CheckInRepository = {
  getAll() { return readJson(CHECKINS_KEY, []).sort(newestFirst); },
  saveAll(checkIns) {
    writeJson(CHECKINS_KEY, checkIns);
    if (checkIns[0]) syncQuietly(syncDailyCheckIn(checkIns[0]));
  },
  clear() { removeJson(CHECKINS_KEY); },
};
export const NutritionRepository = { getAll() { return readJson(NUTRITION_KEY, []).sort(newestFirst); }, getToday(date = new Date().toISOString().slice(0, 10)) { return this.getAll().filter((meal) => meal.date === date); }, saveAll(meals) { writeJson(NUTRITION_KEY, meals); }, add(meal) { const meals = [meal, ...this.getAll()]; this.saveAll(meals); return meals; }, clear() { removeJson(NUTRITION_KEY); } };

import { readJson, writeJson } from "../utils/storage";
import { supabase } from "../supabase";
import { toDailyCheckInCloudPayload, fromDailyCheckInCloudRow } from "../checkInCloudMapper";
import { checkInCacheKey, pendingCheckInsKey, mergeCloudCheckIns } from "./checkInCacheHelpers";
import { TrainingCloudRepository } from "./trainingCloudRepository";

const WORKOUT_KEY_PREFIX = "trackfit_workout_";
const SAVED_WORKOUTS_KEY = "trackfit_saved_workouts";
const WORKOUT_HISTORY_KEY = "trackfit_workout_history";
const CHECKINS_KEY = "trackfit_checkins"; // Legacy browser-wide cache. Never show it across accounts.
const LEGACY_CLAIM_KEY = "trackfit_checkins_legacy_claimed";
let activeCheckInAccountId = null;
function currentCheckInKey() {
  return activeCheckInAccountId ? checkInCacheKey(activeCheckInAccountId) : null;
}
function currentPendingKey() {
  return activeCheckInAccountId ? pendingCheckInsKey(activeCheckInAccountId) : null;
}
function markCheckInPending(date) {
  const key = currentPendingKey();
  if (!key || !date) return;
  const pending = new Set(readJson(key, []));
  pending.add(date);
  writeJson(key, [...pending]);
}
const CARDIO_KEY = "trackfit_cardio";
const NUTRITION_KEY = "trackfit_nutrition";
const AI_PLAN_KEY = "trackfit_ai_workout_plan";

function removeJson(key) { localStorage.removeItem(key); }
function newestFirst(left, right) { return new Date(right.completedAt || right.updatedAt || right.date || 0) - new Date(left.completedAt || left.updatedAt || left.date || 0); }
function syncQuietly(action) { Promise.resolve(action).catch((error) => console.warn("TrackFit cloud sync deferred:", error)); }

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
  if (!supabase || !record?.date || !activeCheckInAccountId) return;

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    const userId = userData.user?.id;
    if (!userId || userId !== activeCheckInAccountId) return;

    const payload = toDailyCheckInCloudPayload(record, userId);

    const { data, error } = await supabase
      .from("daily_checkins")
      .upsert(payload, { onConflict: "user_id,checkin_date" })
      .select("*")
      .single();

    if (error) throw error;

    if (data?.id) {
      // Only acknowledge this write in the same authenticated account.
      if (userId !== activeCheckInAccountId) return;
      const key = currentCheckInKey();
      const current = readJson(key, []);
      writeJson(key, current.map((item) => item.date === record.date ? { ...item, id: data.id } : item));
      const pendingKey = currentPendingKey();
      writeJson(pendingKey, readJson(pendingKey, []).filter((date) => date !== record.date));
    }
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
  setActiveUser(userId) {
    activeCheckInAccountId = typeof userId === "string" && userId ? userId : null;
  },
  getAll() {
    const key = currentCheckInKey();
    if (!key) return [];
    return readJson(key, []).sort(newestFirst);
  },
  getLegacyCount() {
    if (!activeCheckInAccountId || localStorage.getItem(LEGACY_CLAIM_KEY)) return 0;
    return readJson(CHECKINS_KEY, []).length;
  },
  importLegacyForCurrentUser() {
    const account = activeCheckInAccountId;
    if (!account || localStorage.getItem(LEGACY_CLAIM_KEY)) return 0;
    const records = readJson(CHECKINS_KEY, []);
    if (!records.length) return 0;
    const current = this.getAll();
    const existingDates = new Set(current.map((item) => item.date));
    const imported = records.filter((record) => record?.date && !existingDates.has(record.date));
    const merged = mergeCloudCheckIns(records, current, []);
    writeJson(checkInCacheKey(account), merged);
    localStorage.setItem(LEGACY_CLAIM_KEY, account);
    const pendingKey = pendingCheckInsKey(account);
    const dates = new Set([...readJson(pendingKey, []), ...imported.map((x) => x.date)]);
    writeJson(pendingKey, [...dates]);
    imported.forEach((record) => syncQuietly(syncDailyCheckIn(record)));
    return imported.length;
  },
  async hydrateForUser(userId) {
    this.setActiveUser(userId);
    if (!supabase || !userId) return this.getAll();
    // Supabase RLS and user_id filter both protect this private health data.
    const { data, error } = await supabase.from("daily_checkins")
      .select("*").eq("user_id", userId).order("checkin_date", { ascending: false });
    if (error) throw error;
    if (activeCheckInAccountId !== userId) return [];
    const key = checkInCacheKey(userId);
    const local = readJson(key, []);
    const pending = readJson(pendingCheckInsKey(userId), []);
    const remote = (data || []).map(fromDailyCheckInCloudRow);
    const merged = mergeCloudCheckIns(local, remote, pending);
    writeJson(key, merged);
    // Deferred to the next event loop turn to avoid interacting with auth
    // APIs synchronously from Supabase's onAuthStateChange callback.
    if (pending.length && typeof window !== "undefined") {
      window.setTimeout(() => {
        if (activeCheckInAccountId !== userId) return;
        const pendingSet = new Set(readJson(pendingCheckInsKey(userId), []));
        merged.filter((x) => pendingSet.has(x.date))
          .forEach((record) => syncQuietly(syncDailyCheckIn(record)));
      }, 0);
    }
    return merged;
  },
  saveAll(checkIns) {
    const key = currentCheckInKey();
    if (!key) throw new Error("Sign in to save your daily check-in.");
    writeJson(key, checkIns);
    if (checkIns[0]) {
      markCheckInPending(checkIns[0].date);
      window.dispatchEvent(new CustomEvent("trackfit:checkin-saved", { detail: { date: checkIns[0].date } }));
      syncQuietly(syncDailyCheckIn(checkIns[0]));
    }
  },
  clear() {
    const key = currentCheckInKey();
    if (key) {
      removeJson(key);
      removeJson(currentPendingKey());
    }
  },
};
export const NutritionRepository = { getAll() { return readJson(NUTRITION_KEY, []).sort(newestFirst); }, getToday(date = new Date().toISOString().slice(0, 10)) { return this.getAll().filter((meal) => meal.date === date); }, saveAll(meals) { writeJson(NUTRITION_KEY, meals); }, add(meal) { const meals = [meal, ...this.getAll()]; this.saveAll(meals); return meals; }, clear() { removeJson(NUTRITION_KEY); } };
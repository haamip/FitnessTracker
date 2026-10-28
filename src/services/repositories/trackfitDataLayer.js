import { readJson, writeJson } from "../utils/storage";
import { supabase } from "../supabase";
import { toDailyCheckInCloudPayload, fromDailyCheckInCloudRow } from "../checkInCloudMapper";
import { checkInCacheKey, pendingCheckInsKey, mergeCloudCheckIns } from "./checkInCacheHelpers";
import { mergeImportedSteps } from "./watchStepSave";
import { TrainingCloudRepository } from "./trainingCloudRepository";
import { nutritionCacheKey, nutritionPendingKey, nutritionDeletionsKey, isNutritionId } from "./nutritionCacheHelpers";
import { cardioCacheKey, cardioPendingKey, cardioDeletionsKey, canonicalCardioId } from "./cardioSyncHelpers";
import { workoutHistoryCacheKey, pendingWorkoutIdsKey, toCompletedWorkoutPayload } from "./completedWorkoutSync";

const WORKOUT_KEY_PREFIX = "trackfit_workout_";
const LEGACY_WORKOUT_HISTORY_KEY = "trackfit_workout_history";
const LEGACY_WORKOUT_CLAIM_KEY = "trackfit_workout_history_legacy_claimed";
const SAVED_WORKOUTS_KEY = "trackfit_saved_workouts";
// Historical unowned workout history is intentionally retained, but never assigned to a new login automatically.
let activeWorkoutAccountId = null;
const activeWorkoutHistoryKey = () => activeWorkoutAccountId ? workoutHistoryCacheKey(activeWorkoutAccountId) : null;
const activeWorkoutPendingKey = () => activeWorkoutAccountId ? pendingWorkoutIdsKey(activeWorkoutAccountId) : null;
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
const CARDIO_KEY = "trackfit_cardio"; // Unowned legacy records retained until explicit import.
const CARDIO_LEGACY_CLAIM_KEY = "trackfit_cardio_legacy_claimed";
let activeCardioAccountId = null;
const NUTRITION_KEY = "trackfit_nutrition"; // Historical unowned records; never attach to a login automatically.
let activeNutritionAccountId = null;
const AI_PLAN_KEY = "trackfit_ai_workout_plan";

function removeJson(key) { localStorage.removeItem(key); }
function newestFirst(left, right) { return new Date(right.completedAt || right.updatedAt || right.date || 0) - new Date(left.completedAt || left.updatedAt || left.date || 0); }
function syncQuietly(action) { Promise.resolve(action).catch((error) => console.warn("TrackFit cloud sync deferred:", error)); }

async function syncCompletedWorkout(record) {
  const expectedAccount = activeWorkoutAccountId;
  if (!supabase || !expectedAccount || !record?.id) return { cloudSaved: false };
  try {
    const { data: auth, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (auth.user?.id !== expectedAccount || activeWorkoutAccountId !== expectedAccount) return { cloudSaved: false };
    const payload = toCompletedWorkoutPayload(record, expectedAccount);
    // Older cloud rows have no local_id. Update by cloud id rather than
    // accidentally inserting a duplicate when their duration is edited.
    const query = record.cloudId && record.id === record.cloudId
      ? supabase.from("workout_sessions").update({ ...payload, local_id: null })
        .eq("id", record.cloudId).eq("user_id", expectedAccount)
      : supabase.from("workout_sessions").upsert(payload, { onConflict: "user_id,local_id" });
    const { data, error } = await query.select("id").single();
    if (error) throw error;
    if (!data?.id || activeWorkoutAccountId !== expectedAccount) return { cloudSaved: false };
    const current = HistoryRepository.getAll();
    const latest = current.find((item) => item.id === record.id);
    const cacheKey = activeWorkoutHistoryKey();
    if (latest && cacheKey) {
      writeJson(cacheKey, current.map((item) => item.id === record.id ? { ...item, cloudId: data.id } : item));
    }
    // Do not acknowledge an older upload if an edit was saved while in flight.
    const pendingKey = activeWorkoutPendingKey();
    if (pendingKey && latest && latest.updatedAt === record.updatedAt) {
      writeJson(pendingKey, readJson(pendingKey, []).filter((id) => id !== record.id));
    }
    return { cloudSaved: true };
  } catch (error) {
    console.warn("Workout cloud save deferred; session remains pending locally.", error);
    return { cloudSaved: false };
  }
}

async function syncDailyCheckIn(record) {
  if (!supabase || !record?.date || !activeCheckInAccountId) return { cloudSaved: false };

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    const userId = userData.user?.id;
    if (!userId || userId !== activeCheckInAccountId) return { cloudSaved: false };

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
      return { cloudSaved: true };
    }
    return { cloudSaved: false };
  } catch (error) {
    console.warn("Daily check-in cloud save failed; check-in remains cached locally.", error);
    return { cloudSaved: false };
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
  save(workout, { sync = true } = {}) {
    const current = this.getAll().filter((item) => item.id !== workout.id);
    const next = [{ ...workout, updatedAt: new Date().toISOString() }, ...current];
    writeJson(SAVED_WORKOUTS_KEY, next);
    if (sync) syncQuietly(TrainingCloudRepository.saveTemplate(next[0]));
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
  setActiveUser(userId) {
    activeWorkoutAccountId = typeof userId === "string" && userId ? userId : null;
  },
  getActiveUser() { return activeWorkoutAccountId; },
  getAll() {
    const key = activeWorkoutHistoryKey();
    return key ? readJson(key, []).sort(newestFirst) : [];
  },
  getRecent(limit = 6) { return this.getAll().slice(0, limit); },
  getLegacyCount() {
    if (!activeWorkoutAccountId || localStorage.getItem(LEGACY_WORKOUT_CLAIM_KEY)) return 0;
    return readJson(LEGACY_WORKOUT_HISTORY_KEY, []).length;
  },
  importLegacyForCurrentUser() {
    if (!activeWorkoutAccountId || localStorage.getItem(LEGACY_WORKOUT_CLAIM_KEY)) return 0;
    const legacy = readJson(LEGACY_WORKOUT_HISTORY_KEY, []);
    if (!legacy.length) return 0;
    const existing = this.getAll();
    const identities = new Set(existing.map((item) =>
      [item.title, item.completedAt, item.volume].join("|")));
    const ids = new Set(existing.map((item) => item.id));
    const imported = legacy.filter((item) => {
      if (!item?.id || !item.completedAt || ids.has(item.id)) return false;
      if (identities.has([item.title, item.completedAt, item.volume].join("|"))) return false;
      ids.add(item.id);
      return true;
    }).map((item) => ({ ...item, updatedAt: new Date().toISOString() }));
    this.saveAll([...existing, ...imported]);
    // A legacy browser cache has no owner: import only after explicit consent.
    // Never delete the original, so restoration remains possible if interrupted.
    localStorage.setItem(LEGACY_WORKOUT_CLAIM_KEY, activeWorkoutAccountId);
    for (const item of imported) {
      this.markPending(item.id);
      syncQuietly(syncCompletedWorkout(item));
    }
    return imported.length;
  },
  getPendingIds() {
    const key = activeWorkoutPendingKey();
    return key ? readJson(key, []) : [];
  },
  saveAll(history) {
    const key = activeWorkoutHistoryKey();
    if (!key) return;
    writeJson(key, history);
  },
  markPending(recordId) {
    const key = activeWorkoutPendingKey();
    if (!key || !recordId) return;
    writeJson(key, [...new Set([...readJson(key, []), recordId])]);
  },
  add(record) {
    if (!activeWorkoutAccountId) throw new Error("Sign in to save completed workouts.");
    const item = { ...record, updatedAt: new Date().toISOString() };
    const history = [item, ...this.getAll().filter((x) => x.id !== item.id)];
    this.saveAll(history);
    this.markPending(item.id);
    syncQuietly(syncCompletedWorkout(item));
    return history;
  },
  update(recordId, changes) {
    if (!activeWorkoutAccountId) return null;
    const history = this.getAll().map((record) => record.id === recordId
      ? { ...record, ...changes, updatedAt: new Date().toISOString() } : record);
    const updated = history.find((record) => record.id === recordId) || null;
    if (!updated) return null;
    this.saveAll(history);
    this.markPending(recordId);
    syncQuietly(syncCompletedWorkout(updated));
    return updated;
  },
  async retryPending() {
    const expectedAccount = activeWorkoutAccountId;
    if (!expectedAccount) return;
    const pending = new Set(this.getPendingIds());
    for (const record of this.getAll().filter((item) => pending.has(item.id))) {
      if (activeWorkoutAccountId !== expectedAccount) return;
      await syncCompletedWorkout(record);
    }
  },
  clear() {
    const key = activeWorkoutHistoryKey();
    if (key) removeJson(key);
    const pending = activeWorkoutPendingKey();
    if (pending) removeJson(pending);
  },
};

export const AIPlanRepository = {
  getPlan() { return readJson(AI_PLAN_KEY, []); },
  savePlan(plan) { writeJson(AI_PLAN_KEY, plan); syncQuietly(TrainingCloudRepository.savePlan(plan)); },
  clear() { removeJson(AI_PLAN_KEY); syncQuietly(TrainingCloudRepository.clearPlan()); },
};

export const CardioRepository = {
  setActiveUser(userId) {
    activeCardioAccountId = typeof userId === "string" && userId ? userId : null;
  },
  getActiveUser() { return activeCardioAccountId; },
  getAll() {
    return activeCardioAccountId
      ? readJson(cardioCacheKey(activeCardioAccountId), []).sort(newestFirst) : [];
  },
  saveAll(cardio) {
    if (!activeCardioAccountId) return;
    writeJson(cardioCacheKey(activeCardioAccountId), cardio);
  },
  getPendingIds() {
    return activeCardioAccountId ? readJson(cardioPendingKey(activeCardioAccountId), []) : [];
  },
  markPending(id) {
    if (!activeCardioAccountId || !id) return;
    const key = cardioPendingKey(activeCardioAccountId);
    writeJson(key, [...new Set([...readJson(key, []), String(id)])]);
  },
  acknowledge(id) {
    if (!activeCardioAccountId) return;
    const key = cardioPendingKey(activeCardioAccountId);
    writeJson(key, readJson(key, []).filter(x => x !== id));
  },
  getDeletions() {
    return activeCardioAccountId ? readJson(cardioDeletionsKey(activeCardioAccountId), []) : [];
  },
  markDeletion(id) {
    if (!activeCardioAccountId) return;
    const canonical = canonicalCardioId(id);
    if (!canonical) return;
    const key = cardioDeletionsKey(activeCardioAccountId);
    writeJson(key, [...new Set([...readJson(key, []), canonical])]);
  },
  acknowledgeDeletion(id) {
    if (!activeCardioAccountId) return;
    const key = cardioDeletionsKey(activeCardioAccountId);
    writeJson(key, readJson(key, []).filter(x => x !== id));
  },
  getLegacyCount() {
    return activeCardioAccountId && !localStorage.getItem(CARDIO_LEGACY_CLAIM_KEY)
      ? readJson(CARDIO_KEY, []).length : 0;
  },
  importLegacyForCurrentUser() {
    if (!activeCardioAccountId || localStorage.getItem(CARDIO_LEGACY_CLAIM_KEY)) return 0;
    const existing = this.getAll();
    const keys = new Set(existing.map(row => canonicalCardioId(row.id)).filter(Boolean));
    const legacy = readJson(CARDIO_KEY, []);
    let added = 0;
    const imported = legacy.filter(row => row?.date && row?.type).map(row => {
      const id = canonicalCardioId(row.id) ? String(row.id) : `cardio-${crypto.randomUUID()}`;
      return { ...row, id };
    }).filter(row => {
      const key = canonicalCardioId(row.id);
      if (!key || keys.has(key)) return false;
      keys.add(key);
      added += 1;
      return true;
    });
    this.saveAll([...existing, ...imported]);
    for (const row of imported) this.markPending(row.id);
    localStorage.setItem(CARDIO_LEGACY_CLAIM_KEY, activeCardioAccountId);
    return added;
  },
  clear() {
    if (!activeCardioAccountId) return;
    removeJson(cardioCacheKey(activeCardioAccountId));
    removeJson(cardioPendingKey(activeCardioAccountId));
    removeJson(cardioDeletionsKey(activeCardioAccountId));
  },
};
export const CheckInRepository = {
  setActiveUser(userId) {
    activeCheckInAccountId = typeof userId === "string" && userId ? userId : null;
  },
  getAll() {
    const key = currentCheckInKey();
    if (!key) return [];
    return readJson(key, []).sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
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
      // Resolve with a cloud status, not a false claim that network backup succeeded.
      return syncDailyCheckIn(checkIns[0]);
    }
    return Promise.resolve({ cloudSaved: false });
  },
  saveStepsFromWatch(date, imported) {
    const oldRecords = this.getAll();
    const existing = oldRecords.find((item) => item.date === date);
    const updated = mergeImportedSteps(existing, date, imported);
    return this.saveAll([updated, ...oldRecords.filter((item) => item.date !== date)]);
  },
  clear() {
    const key = currentCheckInKey();
    if (key) {
      removeJson(key);
      removeJson(currentPendingKey());
    }
  },
};
export const NutritionRepository = {
  setActiveUser(userId) {
    activeNutritionAccountId = typeof userId === "string" && userId ? userId : null;
  },
  getActiveUser() { return activeNutritionAccountId; },
  getAll() {
    return activeNutritionAccountId
      ? readJson(nutritionCacheKey(activeNutritionAccountId), []).sort(newestFirst)
      : [];
  },
  getToday(date = new Date().toISOString().slice(0, 10)) {
    return this.getAll().filter((meal) => meal.date === date);
  },
  saveAll(meals) {
    if (!activeNutritionAccountId) throw new Error("Sign in to save nutrition.");
    writeJson(nutritionCacheKey(activeNutritionAccountId), meals);
  },
  add(meal) {
    const meals = [meal, ...this.getAll().filter(x => x.id !== meal.id)];
    this.saveAll(meals);
    return meals;
  },
  getPendingIds() {
    return activeNutritionAccountId ? readJson(nutritionPendingKey(activeNutritionAccountId), []) : [];
  },
  markPending(id) {
    if (!activeNutritionAccountId || !isNutritionId(id)) return;
    const key = nutritionPendingKey(activeNutritionAccountId);
    writeJson(key, [...new Set([...readJson(key, []), id])]);
  },
  acknowledge(id) {
    if (!activeNutritionAccountId) return;
    const key = nutritionPendingKey(activeNutritionAccountId);
    writeJson(key, readJson(key, []).filter(value => value !== id));
  },
  getDeletions() {
    return activeNutritionAccountId ? readJson(nutritionDeletionsKey(activeNutritionAccountId), []) : [];
  },
  markDeletion(id) {
    if (!activeNutritionAccountId || !isNutritionId(id)) return;
    const key = nutritionDeletionsKey(activeNutritionAccountId);
    writeJson(key, [...new Set([...readJson(key, []), id])]);
  },
  acknowledgeDeletion(id) {
    if (!activeNutritionAccountId) return;
    const key = nutritionDeletionsKey(activeNutritionAccountId);
    writeJson(key, readJson(key, []).filter(value => value !== id));
  },
  getLegacyCount() {
    return activeNutritionAccountId ? readJson(NUTRITION_KEY, []).length : 0;
  },
  clear() {
    if (!activeNutritionAccountId) return;
    // Explicitly clearing the cache clears its pending bookkeeping too.
    // This is device-only; it never deletes records from Supabase.
    removeJson(nutritionCacheKey(activeNutritionAccountId));
    removeJson(nutritionPendingKey(activeNutritionAccountId));
    removeJson(nutritionDeletionsKey(activeNutritionAccountId));
  },
};
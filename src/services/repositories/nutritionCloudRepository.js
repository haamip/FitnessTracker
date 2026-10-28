import { supabase } from "../supabase";
import { NutritionRepository } from "./trackfitDataLayer";
import {
  fromNutritionCloudRow, toNutritionCloudPayload, mergeNutritionCache, isNutritionId,
} from "./nutritionCacheHelpers";

const inFlight = new Map();
const active = id => Boolean(id) && NutritionRepository.getActiveUser() === id;

async function signedInUserId() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id || null;
}

async function uploadOne(meal) {
  const userId = NutritionRepository.getActiveUser();
  if (!supabase || !userId || !isNutritionId(meal?.id)) return false;
  const key = `${userId}:${meal.id}`;
  if (inFlight.has(key)) return inFlight.get(key);
  const pendingUpload = (async () => {
    const authId = await signedInUserId();
    if (!active(userId) || authId !== userId ||
      NutritionRepository.getDeletions().includes(meal.id)) return false;

    const { data, error } = await supabase.from("nutrition_entries")
      .upsert(toNutritionCloudPayload(meal, userId), { onConflict: "id" })
      .select("*").single();
    if (error) throw error;
    if (!active(userId)) return false;
    if (NutritionRepository.getDeletions().includes(meal.id)) return false;
    const current = NutritionRepository.getAll().find(x => x.id === meal.id);
    // An edit might have happened while the previous upload was in flight.
    // Keep it pending, rather than overwriting newer local values.
    if (!current || current.syncVersion !== meal.syncVersion) return false;
    NutritionRepository.add(fromNutritionCloudRow(data));
    NutritionRepository.acknowledge(meal.id);
    return true;
  })();
  inFlight.set(key, pendingUpload);
  try { return await pendingUpload; }
  finally { if (inFlight.get(key) === pendingUpload) inFlight.delete(key); }
}

async function flushDeletions() {
  const userId = NutritionRepository.getActiveUser();
  if (!supabase || !userId) return;
  if ((await signedInUserId()) !== userId || !active(userId)) return;
  for (const id of NutritionRepository.getDeletions()) {
    if (!active(userId)) return;
    const runningUpload = inFlight.get(`${userId}:${id}`);
    if (runningUpload) { try { await runningUpload; } catch { /* delete still proceeds */ } }
    const { error } = await supabase.from("nutrition_entries")
      .delete().eq("id", id).eq("user_id", userId);
    if (error) throw error;
    if (active(userId)) NutritionRepository.acknowledgeDeletion(id);
  }
}

export const NutritionCloudRepository = {
  getCached() { return NutritionRepository.getAll(); },
  getPendingCount() {
    return NutritionRepository.getPendingIds().length + NutritionRepository.getDeletions().length;
  },

  async retryPending() {
    const userId = NutritionRepository.getActiveUser();
    if (!userId || !supabase) return this.getPendingCount();
    try { await flushDeletions(); }
    catch (error) { console.warn("Pending nutrition deletion will retry.", error); }
    const pendingIds = new Set(NutritionRepository.getPendingIds());
    const meals = this.getCached().filter(meal => pendingIds.has(meal.id));
    for (const meal of meals) {
      if (!active(userId)) break;
      try { await uploadOne(meal); }
      catch (error) { console.warn("Pending nutrition backup will retry.", error); }
    }
    return this.getPendingCount();
  },

  async loadForDate(operationalDate) {
    const userId = NutritionRepository.getActiveUser();
    if (!userId || !supabase) return { meals: this.getCached(), offline: true };
    try {
      if ((await signedInUserId()) !== userId || !active(userId))
        return { meals: this.getCached(), offline: true };

      const lookback = new Date(operationalDate + "T12:00:00Z");
      lookback.setUTCDate(lookback.getUTCDate() - 30);
      const { data, error } = await supabase.from("nutrition_entries").select("*")
        .eq("user_id", userId).gte("entry_date", lookback.toISOString().slice(0, 10))
        .order("created_at", { ascending: false }).limit(120);
      if (error) throw error;
      if (!active(userId)) return { meals: [], offline: true };

      const merged = mergeNutritionCache(
        (data || []).map(fromNutritionCloudRow), this.getCached(),
        NutritionRepository.getPendingIds(), NutritionRepository.getDeletions(),
      );
      NutritionRepository.saveAll(merged);
      if (this.getPendingCount()) {
        Promise.resolve().then(() => this.retryPending())
          .catch(error => console.warn("Nutrition sync deferred.", error));
      }
      return { meals: merged, offline: false };
    } catch (error) {
      console.warn("Nutrition cloud load failed; using account cache.", error);
      return { meals: this.getCached(), offline: true };
    }
  },

  async save(meal) {
    const userId = NutritionRepository.getActiveUser();
    if (!userId || !isNutritionId(meal?.id)) throw new Error("Sign in to save your meal.");
    const record = { ...meal, updatedAt: new Date().toISOString(), syncVersion: crypto.randomUUID() };
    NutritionRepository.add(record);
    NutritionRepository.markPending(record.id);
    try {
      const saved = await uploadOne(record);
      return { meal: this.getCached().find(x => x.id === record.id) || record, cloudSaved: saved };
    } catch (error) {
      console.warn("Nutrition saved locally; cloud backup pending.", error);
      return { meal: record, cloudSaved: false };
    }
  },

  async remove(id) {
    if (!NutritionRepository.getActiveUser() || !isNutritionId(id))
      throw new Error("Sign in to delete a saved meal.");
    NutritionRepository.markDeletion(id);
    NutritionRepository.acknowledge(id);
    NutritionRepository.saveAll(this.getCached().filter(meal => meal.id !== id));
    try { await flushDeletions(); }
    catch (error) { console.warn("Nutrition delete will retry.", error); }
    return { cloudSaved: !NutritionRepository.getDeletions().includes(id) };
  },
};

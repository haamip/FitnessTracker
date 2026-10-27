import { supabase } from "../supabase";
import { CardioRepository as LocalCardioRepository } from "./trackfitDataLayer";
import { canonicalCardioId, mergeCloudCardio } from "./cardioSyncHelpers";

function toNumber(value) {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : 0;
}

function toSession(row) {
  return {
    id: row.id,
    date: row.session_date,
    type: row.activity_type,
    distanceKm: toNumber(row.distance_km),
    durationMin: toNumber(row.duration_min),
    steps: Math.round(toNumber(row.steps)),
    calories: Math.round(toNumber(row.calories)),
    zone: row.effort_zone || "Zone 2",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getUserId() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id || null;
}

function sameAccount(userId) {
  return Boolean(userId) && LocalCardioRepository.getActiveUser() === userId;
}

async function uploadPending(session) {
  const userId = LocalCardioRepository.getActiveUser();
  if (!supabase || !userId || !session) return false;
  const id = canonicalCardioId(session.id);
  if (!id || LocalCardioRepository.getDeletions().includes(id)) return false;
  const confirmedId = await getUserId();
  if (!sameAccount(userId) || confirmedId !== userId) return false;
  const payload = {
    id, user_id: userId,
    session_date: session.date,
    activity_type: session.type,
    distance_km: toNumber(session.distanceKm),
    duration_min: Math.round(toNumber(session.durationMin)),
    steps: Math.round(toNumber(session.steps)),
    calories: Math.round(toNumber(session.calories)),
    effort_zone: session.zone || null,
  };
  // Stable primary key makes a retry safe even if the network dropped after
  // Supabase committed but before the client received its acknowledgement.
  const { data, error } = await supabase
    .from("cardio_sessions")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();
  if (error) throw error;
  if (!sameAccount(userId)) return false;
  if (LocalCardioRepository.getDeletions().includes(id)) return false;
  const remote = toSession(data);
  LocalCardioRepository.saveAll([
    remote,
    ...LocalCardioRepository.getAll().filter(row => canonicalCardioId(row.id) !== id),
  ]);
  LocalCardioRepository.acknowledge(session.id);
  return true;
}

async function flushDeletions() {
  const userId = LocalCardioRepository.getActiveUser();
  if (!supabase || !userId) return;
  const authId = await getUserId();
  if (!sameAccount(userId) || authId !== userId) return;
  for (const id of LocalCardioRepository.getDeletions()) {
    if (!sameAccount(userId)) return;
    const { error } = await supabase.from("cardio_sessions")
      .delete().eq("user_id", userId).eq("id", id);
    if (error) throw error;
    if (sameAccount(userId)) LocalCardioRepository.acknowledgeDeletion(id);
  }
}

export const CardioCloudRepository = {
  getCached() { return LocalCardioRepository.getAll(); },
  getPendingCount() { return LocalCardioRepository.getPendingIds().length + LocalCardioRepository.getDeletions().length; },

  async retryPending() {
    const userId = LocalCardioRepository.getActiveUser();
    if (!userId || !supabase) return;
    const pending = new Set(LocalCardioRepository.getPendingIds());
    const rows = LocalCardioRepository.getAll().filter(row => pending.has(row.id));
    for (const row of rows) {
      if (!sameAccount(userId)) return;
      try { await uploadPending(row); }
      catch (error) { console.warn("Cardio backup pending.", error); }
    }
    try { await flushDeletions(); }
    catch (error) { console.warn("Cardio deletions pending.", error); }
  },

  async getAll() {
    if (!supabase) return this.getCached();
    const userId = LocalCardioRepository.getActiveUser();
    try {
      const authId = await getUserId();
      if (!sameAccount(userId) || authId !== userId) return this.getCached();
      const { data, error } = await supabase
        .from("cardio_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("session_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!sameAccount(userId)) return [];
      const merged = mergeCloudCardio(
        (data || []).map(toSession), this.getCached(),
        LocalCardioRepository.getPendingIds(), LocalCardioRepository.getDeletions(),
      );
      LocalCardioRepository.saveAll(merged);
      if (this.getPendingCount()) {
        Promise.resolve().then(() => this.retryPending())
          .catch(error => console.warn("Cardio sync will retry later.", error));
      }
      return merged;
    } catch (error) {
      console.warn("Cardio cloud load failed; using account-scoped local cache.", error);
      return this.getCached();
    }
  },

  async add(session) {
    const userId = LocalCardioRepository.getActiveUser();
    if (!userId) throw new Error("Sign in to save cardio.");
    if (!canonicalCardioId(session.id)) throw new Error("Invalid cardio session identifier.");
    LocalCardioRepository.saveAll([session, ...this.getCached().filter(item => item.id !== session.id)]);
    LocalCardioRepository.markPending(session.id);
    try {
      const success = await uploadPending(session);
      if (success) return this.getCached().find(row => canonicalCardioId(row.id) === canonicalCardioId(session.id));
    } catch (error) {
      console.warn("Cardio saved locally; cloud backup pending.", error);
    }
    return { ...session, cloudPending: true };
  },

  async remove(id) {
    if (!LocalCardioRepository.getActiveUser()) throw new Error("Sign in to delete cardio.");
    // Hide locally at once; a tombstone stops a stale cloud refresh restoring
    // a deletion while the device is offline.
    LocalCardioRepository.markDeletion(id);
    LocalCardioRepository.acknowledge(id);
    const target = canonicalCardioId(id);
    LocalCardioRepository.saveAll(this.getCached().filter(row =>
      target ? canonicalCardioId(row.id) !== target : row.id !== id));
    await this.retryPending();
    return this.getCached();
  },
};

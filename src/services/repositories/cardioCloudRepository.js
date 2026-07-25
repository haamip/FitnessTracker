import { supabase } from "../supabase";
import { CardioRepository as LocalCardioRepository } from "./trackfitDataLayer";

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

export const CardioCloudRepository = {
  getCached() {
    return LocalCardioRepository.getAll();
  },

  async getAll() {
    if (!supabase) return this.getCached();

    try {
      const userId = await getUserId();
      if (!userId) return this.getCached();

      const { data, error } = await supabase
        .from("cardio_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("session_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      const sessions = (data || []).map(toSession);
      LocalCardioRepository.saveAll(sessions);
      return sessions;
    } catch (error) {
      console.warn("Cardio cloud load failed; using local cache.", error);
      return this.getCached();
    }
  },

  async add(session) {
    const cached = [session, ...this.getCached().filter((item) => item.id !== session.id)];
    LocalCardioRepository.saveAll(cached);

    if (!supabase) return session;

    const userId = await getUserId();
    if (!userId) return session;

    const payload = {
      user_id: userId,
      session_date: session.date,
      activity_type: session.type,
      distance_km: toNumber(session.distanceKm),
      duration_min: Math.round(toNumber(session.durationMin)),
      steps: Math.round(toNumber(session.steps)),
      calories: Math.round(toNumber(session.calories)),
      effort_zone: session.zone || null,
    };

    const { data, error } = await supabase
      .from("cardio_sessions")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;

    const saved = toSession(data);
    const next = [saved, ...cached.filter((item) => item.id !== session.id && item.id !== saved.id)];
    LocalCardioRepository.saveAll(next);
    return saved;
  },

  async remove(id) {
    const cached = this.getCached().filter((session) => session.id !== id);
    LocalCardioRepository.saveAll(cached);

    if (!supabase) return cached;

    const userId = await getUserId();
    if (!userId) return cached;

    const { error } = await supabase
      .from("cardio_sessions")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
    return cached;
  },
};

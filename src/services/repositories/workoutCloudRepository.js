import { supabase } from "../supabase";
import { HistoryRepository } from "./trackfitDataLayer";

async function getUserId() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id || null;
}

function toWorkout(row) {
  return {
    id: row.id,
    workoutId: row.template_id || row.id,
    title: row.title || "Completed workout",
    completedAt: row.completed_at || row.created_at,
    startedAt: row.started_at,
    seconds: row.duration_seconds || 0,
    durationSeconds: row.duration_seconds || 0,
    completedSets: row.completed_sets || 0,
    doneSets: row.completed_sets || 0,
    totalSets: row.total_sets || 0,
    volume: Number(row.total_volume) || 0,
    notes: row.notes || "",
    prs: Array.isArray(row.prs) ? row.prs : [],
    exercises: Array.isArray(row.exercises) ? row.exercises : [],
  };
}

export const WorkoutCloudRepository = {
  getCached() {
    return HistoryRepository.getAll();
  },

  async getAll() {
    if (!supabase) return this.getCached();

    try {
      const userId = await getUserId();
      if (!userId) return this.getCached();

      const { data, error } = await supabase
        .from("workout_sessions")
        .select("*")
        .eq("user_id", userId)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false });

      if (error) throw error;

      const workouts = (data || []).map(toWorkout);
      HistoryRepository.saveAll(workouts);
      return workouts;
    } catch (error) {
      console.warn("Workout history cloud load failed; using local cache.", error);
      return this.getCached();
    }
  },

  async add(workout) {
    HistoryRepository.add(workout);

    if (!supabase) return workout;

    try {
      const userId = await getUserId();
      if (!userId) return workout;

      const completedAt = workout.completedAt || new Date().toISOString();
      const durationSeconds = Number(workout.durationSeconds ?? workout.seconds) || 0;
      const startedAt = new Date(new Date(completedAt).getTime() - durationSeconds * 1000).toISOString();

      const payload = {
        user_id: userId,
        title: workout.title || "Completed workout",
        started_at: startedAt,
        completed_at: completedAt,
        duration_seconds: durationSeconds,
        exercises: workout.exercises || [],
        total_volume: Number(workout.volume) || 0,
        notes: workout.notes || null,
        prs: workout.prs || [],
        completed_sets: Number(workout.completedSets ?? workout.doneSets) || 0,
        total_sets: Number(workout.totalSets) || 0,
      };

      const { data, error } = await supabase
        .from("workout_sessions")
        .insert(payload)
        .select("*")
        .single();

      if (error) throw error;

      const saved = toWorkout(data);
      const next = [saved, ...HistoryRepository.getAll().filter((item) => item.id !== workout.id && item.id !== saved.id)];
      HistoryRepository.saveAll(next);
      return saved;
    } catch (error) {
      console.warn("Workout cloud save failed; workout remains stored locally.", error);
      return workout;
    }
  },
};

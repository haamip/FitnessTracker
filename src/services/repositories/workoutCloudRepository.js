import { supabase } from "../supabase";
import { HistoryRepository } from "./trackfitDataLayer";
import { mergeCompletedWorkouts, toCompletedWorkout } from "./completedWorkoutSync";

async function getUserId() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id || null;
}

/**
 * Cloud records are scoped twice: the authenticated user and the account
 * currently active in the local repository. Pending local workouts never
 * disappear merely because the server has not received them yet.
 */
export const WorkoutCloudRepository = {
  getCached() { return HistoryRepository.getAll(); },

  async getAll() {
    if (!supabase) return this.getCached();
    try {
      const userId = await getUserId();
      if (!userId || HistoryRepository.getActiveUser() !== userId) return this.getCached();
      const { data, error } = await supabase
        .from("workout_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "completed")
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false });

      if (error) throw error;
      if (HistoryRepository.getActiveUser() !== userId) return [];
      const merged = mergeCompletedWorkouts(
        (data || []).map(toCompletedWorkout),
        HistoryRepository.getAll(),
        HistoryRepository.getPendingIds(),
      );
      HistoryRepository.saveAll(merged);
      // Retry in the foreground without holding up the app while offline.
      // The pending queue and per-user idempotent upsert are the source of truth.
      if (HistoryRepository.getPendingIds().length) {
        Promise.resolve().then(() => HistoryRepository.retryPending())
          .catch((reason) => console.warn("Pending workouts will retry later.", reason));
      }
      return merged;
    } catch (error) {
      console.warn("Workout history cloud load failed; keeping local records.", error);
      return this.getCached();
    }
  },

  async add(workout) {
    // The local repository is responsible for exactly one cloud upsert.
    // The previous implementation double-inserted when this helper was used.
    HistoryRepository.add(workout);
    return workout;
  },
};

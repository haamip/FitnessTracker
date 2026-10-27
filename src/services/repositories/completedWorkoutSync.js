/**
 * Completed workout cache is account-scoped. Never claim a legacy unowned
 * browser cache for whichever account happens to log in first.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function workoutHistoryCacheKey(userId) {
  if (!UUID.test(userId || "")) throw new Error("Sign in to access workout history.");
  return `trackfit_workout_history:${userId}`;
}
export function pendingWorkoutIdsKey(userId) {
  return `${workoutHistoryCacheKey(userId)}:pending`;
}
export function toCompletedWorkout(row) {
  return {
    id: row.local_id || row.id,
    cloudId: row.id,
    workoutId: row.template_id || row.local_id || row.id,
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
export function mergeCompletedWorkouts(remote = [], local = [], pendingIds = []) {
  const pending = new Set(pendingIds.map(String));
  const byId = new Map();
  for (const record of remote) if (record?.id) byId.set(String(record.id), record);
  for (const record of local) {
    if (record?.id && (pending.has(String(record.id)) || !byId.has(String(record.id)))) {
      byId.set(String(record.id), record);
    }
  }
  return [...byId.values()].sort((a,b) =>
    String(b.completedAt || "").localeCompare(String(a.completedAt || "")));
}
export function toCompletedWorkoutPayload(workout, userId) {
  if (!UUID.test(userId || "") || !workout?.id) throw new Error("A signed-in workout is required.");
  const completedAt = workout.completedAt || new Date().toISOString();
  const durationSeconds = Math.max(0, Math.floor(Number(workout.durationSeconds ?? workout.seconds) || 0));
  const startedAt = workout.startedAt || new Date(Date.parse(completedAt) - durationSeconds * 1000).toISOString();
  return {
    user_id: userId,
    local_id: String(workout.id),
    title: workout.title || "Completed workout",
    status: "completed",
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
}

import { readWorkoutHistory } from "./workoutEngine";

/**
 * Summarises the last seven days for dashboard coaching cards.
 */
export function getWeeklyTrainingSummary(history = readWorkoutHistory()) {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const week = history.filter((workout) => new Date(workout.completedAt).getTime() >= sevenDaysAgo);

  const totalVolume = week.reduce((sum, workout) => sum + (workout.volume || 0), 0);
  const totalSets = week.reduce((sum, workout) => sum + (workout.completedSets || 0), 0);
  const totalPrs = week.reduce((sum, workout) => sum + (workout.prs?.length || 0), 0);

  return {
    workouts: week.length,
    totalVolume,
    totalSets,
    totalPrs,
    averageDuration:
      week.length === 0
        ? 0
        : Math.round(week.reduce((sum, workout) => sum + workout.durationSeconds, 0) / week.length / 60),
  };
}

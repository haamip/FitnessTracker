import { HistoryRepository } from "./trackfitDataLayer";

export const WORKOUT_HISTORY_KEY = "trackfit_workout_history";

/**
 * Converts weight and reps into simple training volume.
 *
 * Volume is not perfect science, but it is useful for trends, weekly summaries,
 * and recovery estimates: 100kg x 10 reps = 1000kg moved.
 */
export function calculateSetVolume(set) {
  const weight = Number.parseFloat(set.weight) || 0;
  const reps = Number.parseFloat(set.reps) || 0;
  return weight * reps;
}

/**
 * Calculates core live workout stats from the current exercises on screen.
 *
 * This powers the progress bar, volume counter, and smart summary without the
 * React page needing to know the maths behind the workout.
 */
export function calculateWorkoutTotals(exercises) {
  const totalSets = exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
  const doneSets = exercises.reduce(
    (sum, exercise) => sum + exercise.sets.filter((set) => set.done).length,
    0,
  );

  const volume = exercises.reduce(
    (sum, exercise) =>
      sum +
      exercise.sets.reduce((setSum, set) => {
        if (!set.done) return setSum;
        return setSum + calculateSetVolume(set);
      }, 0),
    0,
  );

  return {
    totalSets,
    doneSets,
    volume,
    percent: totalSets === 0 ? 0 : Math.round((doneSets / totalSets) * 100),
  };
}

/**
 * Reads completed workouts through the repository layer.
 *
 * Kept as a compatibility helper while older service code is migrated away from
 * direct storage helpers one file at a time.
 */
export function readWorkoutHistory() {
  return HistoryRepository.getAll();
}

/**
 * Finds the most recent completed version of one exercise.
 *
 * Matching by libraryId first is important because a workout exercise has a
 * unique runtime id, while libraryId stays stable across every session.
 */
export function findPreviousExercise(history, exercise) {
  const key = exercise.libraryId || exercise.id;

  for (const workout of history) {
    const match = (workout.exercises || []).find(
      (item) => (item.libraryId || item.id) === key || item.name === exercise.name,
    );

    if (match) return match;
  }

  return null;
}

/**
 * Displays the previous result for a matching set row.
 */
export function getPreviousSetLabel(previousExercise, setIndex) {
  const previousSet = previousExercise?.sets?.[setIndex];

  if (!previousSet) return "-";

  const weight = previousSet.weight || "-";
  const reps = previousSet.reps || "-";
  return `${weight} x ${reps}`;
}

/**
 * Builds a clean completed-workout object for localStorage.
 *
 * This is the data contract the Intelligence Engine expects. Future cloud sync
 * can use this same shape rather than reverse-engineering the UI state.
 */
export function buildCompletedWorkout({ id, title, seconds, notes, exercises, totals, prs = [] }) {
  return {
    id: crypto.randomUUID(),
    workoutId: id,
    title,
    completedAt: new Date().toISOString(),
    durationSeconds: seconds,
    completedSets: totals.doneSets,
    totalSets: totals.totalSets,
    volume: totals.volume,
    notes,
    prs,
    exercises,
  };
}

/**
 * Generates sensible warm-up sets from the first working weight we can find.
 *
 * Old-school lifting logic: bar/light set first, then ramp up in bigger jumps
 * without fatiguing the user before the working sets.
 */
export function generateWarmUpSets(exercise, createSet) {
  const firstWorkingWeight = exercise.sets
    .map((set) => Number.parseFloat(set.weight))
    .find((weight) => Number.isFinite(weight) && weight > 0);

  if (!firstWorkingWeight) return [];

  const repsByStep = [10, 8, 5, 3];
  const percentages = [0.4, 0.55, 0.7, 0.85];

  return percentages
    .map((percent, index) => {
      const rawWeight = firstWorkingWeight * percent;
      const roundedWeight = Math.max(5, Math.round(rawWeight / 2.5) * 2.5);
      return createSet(String(roundedWeight), String(repsByStep[index]), "W");
    })
    .filter((set) => Number.parseFloat(set.weight) < firstWorkingWeight);
}

/**
 * Converts seconds into a gym-friendly clock.
 */
export function formatClock(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

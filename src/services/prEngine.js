import { calculateSetVolume } from "./workoutEngine";

/**
 * Epley estimated 1RM.
 *
 * Formula: weight * (1 + reps / 30). It is a rough estimate, but good enough
 * for trend tracking and PR celebrations inside a workout app.
 */
export function estimateOneRepMax(weight, reps) {
  const parsedWeight = Number.parseFloat(weight) || 0;
  const parsedReps = Number.parseFloat(reps) || 0;

  if (parsedWeight <= 0 || parsedReps <= 0) return 0;

  return Math.round(parsedWeight * (1 + parsedReps / 30) * 10) / 10;
}

function collectExerciseRecords(history, exercise) {
  const key = exercise.libraryId || exercise.id;
  const previousSets = [];

  history.forEach((workout) => {
    (workout.exercises || []).forEach((historyExercise) => {
      const historyKey = historyExercise.libraryId || historyExercise.id;

      if (historyKey !== key && historyExercise.name !== exercise.name) return;

      (historyExercise.sets || []).forEach((set) => {
        if (!set.done) return;
        previousSets.push(set);
      });
    });
  });

  return previousSets;
}

/**
 * Detects new PRs in a completed workout.
 *
 * We compare today's completed sets against older completed workouts. The UI can
 * celebrate these immediately on the summary screen/dashboard later.
 */
export function detectWorkoutPRs(history, exercises) {
  const prs = [];

  exercises.forEach((exercise) => {
    const previousSets = collectExerciseRecords(history, exercise);
    const previousBestWeight = Math.max(0, ...previousSets.map((set) => Number.parseFloat(set.weight) || 0));
    const previousBestE1rm = Math.max(
      0,
      ...previousSets.map((set) => estimateOneRepMax(set.weight, set.reps)),
    );
    const previousBestVolume = Math.max(0, ...previousSets.map(calculateSetVolume));

    (exercise.sets || []).forEach((set) => {
      if (!set.done) return;

      const weight = Number.parseFloat(set.weight) || 0;
      const reps = Number.parseFloat(set.reps) || 0;
      const e1rm = estimateOneRepMax(weight, reps);
      const volume = calculateSetVolume(set);

      if (weight > previousBestWeight && previousBestWeight > 0) {
        prs.push({ type: "Heaviest Set", exercise: exercise.name, value: `${weight}kg x ${reps}` });
      }

      if (e1rm > previousBestE1rm && previousBestE1rm > 0) {
        prs.push({ type: "Estimated 1RM", exercise: exercise.name, value: `${e1rm}kg` });
      }

      if (volume > previousBestVolume && previousBestVolume > 0) {
        prs.push({ type: "Set Volume", exercise: exercise.name, value: `${Math.round(volume)}kg` });
      }
    });
  });

  return prs.slice(0, 6);
}

/**
 * Builds the all-time PR list used by Progress and Dashboard.
 */
export function getAllTimePRs(history) {
  const bestByExercise = new Map();

  history.forEach((workout) => {
    (workout.exercises || []).forEach((exercise) => {
      (exercise.sets || []).forEach((set) => {
        if (!set.done) return;

        const e1rm = estimateOneRepMax(set.weight, set.reps);
        const currentBest = bestByExercise.get(exercise.name);

        if (!currentBest || e1rm > currentBest.e1rm) {
          bestByExercise.set(exercise.name, {
            exercise: exercise.name,
            e1rm,
            set: `${set.weight || 0}kg x ${set.reps || 0}`,
          });
        }
      });
    });
  });

  return [...bestByExercise.values()].sort((a, b) => b.e1rm - a.e1rm).slice(0, 6);
}

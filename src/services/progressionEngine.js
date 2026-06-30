import { findPreviousExercise } from "./workoutEngine";

function roundToGymPlate(weight) {
  return Math.round(weight / 2.5) * 2.5;
}

/**
 * Creates the next-session recommendation for one exercise.
 *
 * Simple first version:
 * - If every previous set was completed, add a small weight jump.
 * - If some sets were missed, repeat the same load and focus on clean reps.
 * - If no history exists, use the exercise's default target.
 */
export function getExerciseRecommendation(exercise, history) {
  const previousExercise = findPreviousExercise(history, exercise);

  if (!previousExercise) {
    return {
      previousExercise: null,
      reason: "No previous data yet. Log this exercise once and TrackFit will coach the next session.",
      targets: exercise.sets.map((set) => ({ weight: set.weight || "", reps: set.reps || "8-12" })),
    };
  }

  const completedSets = (previousExercise.sets || []).filter((set) => set.done);
  const allSetsCompleted = completedSets.length > 0 && completedSets.length === previousExercise.sets.length;

  const targets = exercise.sets.map((set, index) => {
    const previousSet = previousExercise.sets[index] || completedSets.at(-1) || set;
    const previousWeight = Number.parseFloat(previousSet.weight) || 0;
    const suggestedWeight = allSetsCompleted && previousWeight > 0
      ? roundToGymPlate(previousWeight + 2.5)
      : previousWeight;

    return {
      weight: suggestedWeight ? String(suggestedWeight) : set.weight || "",
      reps: previousSet.reps || set.reps || "8-12",
    };
  });

  return {
    previousExercise,
    reason: allSetsCompleted
      ? "All sets were completed last time. Small progressive overload applied."
      : "Repeat last session's load until all target reps are owned.",
    targets,
  };
}

/**
 * Displays one set target in the workout table.
 */
export function getTargetSetLabel(recommendation, setIndex) {
  const target = recommendation.targets[setIndex];

  if (!target) return "â€”";

  const weight = target.weight || "â€”";
  const reps = target.reps || "â€”";
  return `${weight} x ${reps}`;
}

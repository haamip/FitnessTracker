/**
 * ============================================================================
 * TrackFit PR Engine v2
 * ============================================================================
 *
 * PURPOSE
 * -------
 * Finds personal records from workout history.
 *
 * Difficulty
 * ----------
 * ⭐⭐⭐☆☆
 *
 * Why this exists
 * ---------------
 * The Coach and Progress pages need to know when the user is improving.
 *
 * A PR is not just "heaviest weight".
 * It can also be:
 *
 * - best estimated 1RM
 * - most reps at a weight
 * - best set volume
 * - best total exercise volume
 *
 * ============================================================================
 */

import { HistoryRepository } from "./trackfitDataLayer";

function getNumber(value) {
  return Number.parseFloat(value) || 0;
}

function getEstimatedOneRepMax(weight, reps) {
  if (!weight || !reps) return 0;

  return weight * (1 + reps / 30);
}

function getCompletedSets(exercise) {
  return (exercise?.sets || []).filter((set) => set.done);
}

function createExerciseKey(exercise) {
  return exercise?.libraryId || exercise?.name || "unknown-exercise";
}

function createEmptyRecord(exercise) {
  return {
    exercise: exercise?.name || "Unknown exercise",
    libraryId: exercise?.libraryId || null,
    heaviestWeight: null,
    bestEstimatedOneRepMax: null,
    bestSetVolume: null,
    bestReps: null,
    bestExerciseVolume: null,
  };
}

function createSetEntry(workout, exercise, set) {
  const weight = getNumber(set.weight);
  const reps = getNumber(set.reps);
  const setVolume = weight * reps;
  const estimatedOneRepMax = getEstimatedOneRepMax(weight, reps);

  return {
    workoutId: workout.workoutId || workout.id,
    workoutTitle: workout.title || "Completed workout",
    completedAt: workout.completedAt,
    exercise: exercise.name,
    libraryId: exercise.libraryId || null,
    weight,
    reps,
    setVolume,
    estimatedOneRepMax: Math.round(estimatedOneRepMax * 10) / 10,
  };
}

function isBetterNumberEntry(next, current, field) {
  if (!current) return true;
  return next[field] > current[field];
}

export function buildPrEngine(history = HistoryRepository.getAll()) {
  const records = new Map();
  const allSetEntries = [];

  history.forEach((workout) => {
    (workout.exercises || []).forEach((exercise) => {
      const key = createExerciseKey(exercise);
      const record = records.get(key) || createEmptyRecord(exercise);
      const completedSets = getCompletedSets(exercise);

      const exerciseSetEntries = completedSets.map((set) =>
        createSetEntry(workout, exercise, set),
      );

      allSetEntries.push(...exerciseSetEntries);

      exerciseSetEntries.forEach((entry) => {
        if (isBetterNumberEntry(entry, record.heaviestWeight, "weight")) {
          record.heaviestWeight = entry;
        }

        if (isBetterNumberEntry(entry, record.bestEstimatedOneRepMax, "estimatedOneRepMax")) {
          record.bestEstimatedOneRepMax = entry;
        }

        if (isBetterNumberEntry(entry, record.bestSetVolume, "setVolume")) {
          record.bestSetVolume = entry;
        }

        if (isBetterNumberEntry(entry, record.bestReps, "reps")) {
          record.bestReps = entry;
        }
      });

      const exerciseVolume = exerciseSetEntries.reduce(
        (sum, entry) => sum + entry.setVolume,
        0,
      );

      const exerciseVolumeEntry = {
        workoutId: workout.workoutId || workout.id,
        workoutTitle: workout.title || "Completed workout",
        completedAt: workout.completedAt,
        exercise: exercise.name,
        libraryId: exercise.libraryId || null,
        exerciseVolume,
      };

      if (
        !record.bestExerciseVolume ||
        exerciseVolumeEntry.exerciseVolume > record.bestExerciseVolume.exerciseVolume
      ) {
        record.bestExerciseVolume = exerciseVolumeEntry;
      }

      records.set(key, record);
    });
  });

  const exerciseRecords = [...records.values()];

  const bestOverallEstimatedOneRepMax = allSetEntries
    .slice()
    .sort((a, b) => b.estimatedOneRepMax - a.estimatedOneRepMax)[0] || null;

  const heaviestSet = allSetEntries
    .slice()
    .sort((a, b) => b.weight - a.weight)[0] || null;

  const biggestSetVolume = allSetEntries
    .slice()
    .sort((a, b) => b.setVolume - a.setVolume)[0] || null;

  return {
    exerciseRecords,
    totalExercisesTracked: exerciseRecords.length,
    totalCompletedSetsAnalysed: allSetEntries.length,
    bestOverallEstimatedOneRepMax,
    heaviestSet,
    biggestSetVolume,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * ============================================================================
 * DEVELOPER NOTES
 * ============================================================================
 *
 * This engine should only analyse completed workout history.
 *
 * It should not:
 *
 * - render UI
 * - touch localStorage directly
 * - decide training recommendations
 *
 * It only finds performance records.
 *
 * ============================================================================
 */
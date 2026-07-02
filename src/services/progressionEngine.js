/**
 * ============================================================================
 * TrackFit Progression Engine
 * ============================================================================
 *
 * PURPOSE
 * -------
 * Works out whether exercises are improving, stable, or declining.
 *
 * Difficulty
 * ----------
 * ⭐⭐⭐☆☆
 *
 * Why this exists
 * ---------------
 * PR Engine tells us the user's best records.
 * Progression Engine tells us if the user is actually getting better over time.
 *
 * Signals used:
 *
 * 1. Strength - estimated 1RM
 * 2. Volume - total work
 * 3. Reps - total reps
 * 4. Consistency - how much history exists
 * 5. Confidence - how sure the engine is
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

function getExerciseKey(exercise) {
  return exercise?.libraryId || exercise?.name || "unknown-exercise";
}

function getBestSetScore(exercise) {
  const completedSets = getCompletedSets(exercise);

  const bestEstimatedOneRepMax = completedSets.reduce((best, set) => {
    const weight = getNumber(set.weight);
    const reps = getNumber(set.reps);
    return Math.max(best, getEstimatedOneRepMax(weight, reps));
  }, 0);

  const volume = completedSets.reduce((sum, set) => {
    const weight = getNumber(set.weight);
    const reps = getNumber(set.reps);
    return sum + weight * reps;
  }, 0);

  const reps = completedSets.reduce((sum, set) => {
    return sum + getNumber(set.reps);
  }, 0);

  return {
    bestEstimatedOneRepMax: Math.round(bestEstimatedOneRepMax * 10) / 10,
    volume: Math.round(volume),
    reps,
  };
}

function buildExerciseHistory(history) {
  const map = new Map();

  history.forEach((workout) => {
    (workout.exercises || []).forEach((exercise) => {
      const key = getExerciseKey(exercise);
      const entries = map.get(key) || [];

      entries.push({
        exercise: exercise.name || "Unknown exercise",
        libraryId: exercise.libraryId || null,
        workoutTitle: workout.title || "Completed workout",
        completedAt: workout.completedAt,
        ...getBestSetScore(exercise),
      });

      map.set(key, entries);
    });
  });

  return map;
}

function getImprovementPercent(current, previous) {
  if (!previous || previous <= 0) return 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function getTrend(strengthImprovementPercent, volumeImprovementPercent, repImprovementPercent) {
  const combined =
    strengthImprovementPercent * 0.55 +
    volumeImprovementPercent * 0.3 +
    repImprovementPercent * 0.15;

  if (combined >= 2) return "Improving";
  if (combined <= -2) return "Declining";
  return "Stable";
}

function getMomentum(trend, confidence) {
  if (confidence < 50) return "Low";
  if (trend === "Improving" && confidence >= 75) return "High";
  if (trend === "Declining" && confidence >= 75) return "Warning";
  return "Medium";
}

function getConfidence(entryCount) {
  if (entryCount >= 8) return 95;
  if (entryCount >= 5) return 82;
  if (entryCount >= 3) return 64;
  if (entryCount >= 2) return 42;
  return 20;
}

function getRecommendation(trend, improvementPercent, confidence) {
  if (confidence < 50) {
    return "Log more sessions before making major changes.";
  }

  if (trend === "Improving" && improvementPercent >= 4) {
    return "Progress is strong. Consider a small weight increase next time.";
  }

  if (trend === "Improving") {
    return "Keep the current progression going.";
  }

  if (trend === "Declining") {
    return "Performance is dropping. Check recovery, sleep and weekly load.";
  }

  return "Progress is stable. Try adding one rep before increasing weight.";
}

function analyseExercise(entries) {
  const sorted = entries
    .slice()
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

  const current = sorted[0];
  const previous = sorted[1];

  const strengthImprovementPercent = getImprovementPercent(
    current?.bestEstimatedOneRepMax || 0,
    previous?.bestEstimatedOneRepMax || 0,
  );

  const volumeImprovementPercent = getImprovementPercent(
    current?.volume || 0,
    previous?.volume || 0,
  );

  const repImprovementPercent = getImprovementPercent(
    current?.reps || 0,
    previous?.reps || 0,
  );

  const trend = getTrend(
    strengthImprovementPercent,
    volumeImprovementPercent,
    repImprovementPercent,
  );

  const confidence = getConfidence(sorted.length);

  return {
    exercise: current?.exercise || "Unknown exercise",
    libraryId: current?.libraryId || null,
    sessionsTracked: sorted.length,
    trend,
    momentum: getMomentum(trend, confidence),
    confidence,
    currentEstimatedOneRepMax: current?.bestEstimatedOneRepMax || 0,
    previousEstimatedOneRepMax: previous?.bestEstimatedOneRepMax || 0,
    strengthImprovementPercent,
    volumeImprovementPercent,
    repImprovementPercent,
    recommendation: getRecommendation(trend, strengthImprovementPercent, confidence),
    latestSession: current || null,
    previousSession: previous || null,
  };
}

export function buildProgressionEngine(history = HistoryRepository.getAll()) {
  const exerciseHistory = buildExerciseHistory(history);

  const exercises = [...exerciseHistory.values()]
    .map(analyseExercise)
    .sort((a, b) => b.confidence - a.confidence);

  const improving = exercises.filter((exercise) => exercise.trend === "Improving");
  const stable = exercises.filter((exercise) => exercise.trend === "Stable");
  const declining = exercises.filter((exercise) => exercise.trend === "Declining");

  return {
    exercises,
    improvingCount: improving.length,
    stableCount: stable.length,
    decliningCount: declining.length,
    strongestProgress: improving[0] || null,
    biggestConcern: declining[0] || null,
    totalExercisesAnalysed: exercises.length,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * ============================================================================
 * DEVELOPER NOTES
 * ============================================================================
 *
 * This engine does not render anything.
 *
 * It only answers:
 *
 * "Is this exercise improving?"
 *
 * Later we can feed this into:
 *
 * - Coach
 * - Progress page
 * - PR page
 * - Workout Builder
 * - AI recommendations
 *
 * ============================================================================
 */

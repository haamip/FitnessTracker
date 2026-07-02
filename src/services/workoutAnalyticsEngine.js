/**
 * ============================================================================
 * TrackFit Workout Analytics Engine
 * ============================================================================
 *
 * PURPOSE
 * -------
 * Calculates reusable workout statistics from completed workout history.
 *
 * Difficulty
 * ----------
 * ⭐⭐⭐☆☆
 *
 * Why this exists
 * ---------------
 * Dashboard, Coach, Progress, Developer Tools and future AI should not all
 * calculate their own workout stats.
 *
 * This file becomes one source of truth.
 *
 * Data flow:
 *
 * HistoryRepository
 * ↓
 * workoutAnalyticsEngine.js
 * ↓
 * Dashboard / Coach / Progress / Developer Tools
 *
 * ============================================================================
 */

import { HistoryRepository } from "./trackfitDataLayer";

const DAY_MS = 24 * 60 * 60 * 1000;

function toDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isWithinDays(value, days) {
  const date = toDate(value);
  if (!date) return false;

  return Date.now() - date.getTime() <= days * DAY_MS;
}

function getWorkoutVolume(workout) {
  if (Number.isFinite(Number(workout?.volume))) {
    return Number(workout.volume);
  }

  return (workout?.exercises || []).reduce(
    (workoutTotal, exercise) =>
      workoutTotal +
      (exercise.sets || []).reduce((setTotal, set) => {
        if (!set.done) return setTotal;

        const weight = Number.parseFloat(set.weight) || 0;
        const reps = Number.parseFloat(set.reps) || 0;

        return setTotal + weight * reps;
      }, 0),
    0,
  );
}

function getCompletedSets(workout) {
  if (Number.isFinite(Number(workout?.completedSets))) {
    return Number(workout.completedSets);
  }

  return (workout?.exercises || []).reduce(
    (total, exercise) =>
      total + (exercise.sets || []).filter((set) => set.done).length,
    0,
  );
}

function getCompletedReps(workout) {
  return (workout?.exercises || []).reduce(
    (workoutTotal, exercise) =>
      workoutTotal +
      (exercise.sets || []).reduce((setTotal, set) => {
        if (!set.done) return setTotal;

        return setTotal + (Number.parseFloat(set.reps) || 0);
      }, 0),
    0,
  );
}

function getDurationSeconds(workout) {
  return Number(workout?.durationSeconds || workout?.seconds || 0);
}

function countBy(items) {
  const map = new Map();

  items.forEach((item) => {
    if (!item) return;
    map.set(item, (map.get(item) || 0) + 1);
  });

  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function getAllExercises(history) {
  return history.flatMap((workout) => workout.exercises || []);
}

function getAllMuscles(history) {
  return getAllExercises(history).flatMap((exercise) => exercise.primaryMuscles || []);
}

function getWorkoutDayKeys(history) {
  return new Set(
    history
      .map((workout) => toDate(workout.completedAt))
      .filter(Boolean)
      .map((date) => date.toISOString().slice(0, 10)),
  );
}

function calculateCurrentStreak(history) {
  const workoutDays = getWorkoutDayKeys(history);
  let streak = 0;

  for (let offset = 0; offset < 365; offset += 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);

    const key = date.toISOString().slice(0, 10);

    if (!workoutDays.has(key)) {
      if (offset === 0) continue;
      break;
    }

    streak += 1;
  }

  return streak;
}

function calculateLongestStreak(history) {
  const sortedDays = [...getWorkoutDayKeys(history)].sort();

  if (sortedDays.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let index = 1; index < sortedDays.length; index += 1) {
    const previous = new Date(sortedDays[index - 1]);
    const currentDate = new Date(sortedDays[index]);

    const diffDays = Math.round((currentDate - previous) / DAY_MS);

    if (diffDays === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

function readableLabel(value, fallback = "Not enough data yet") {
  if (!value) return fallback;

  return String(value).replaceAll("_", " ");
}

export function buildWorkoutAnalytics(history = HistoryRepository.getAll()) {
  const week = history.filter((workout) => isWithinDays(workout.completedAt, 7));
  const month = history.filter((workout) => isWithinDays(workout.completedAt, 30));

  const totalWorkouts = history.length;
  const totalVolume = history.reduce((sum, workout) => sum + getWorkoutVolume(workout), 0);
  const weeklyVolume = week.reduce((sum, workout) => sum + getWorkoutVolume(workout), 0);
  const monthlyVolume = month.reduce((sum, workout) => sum + getWorkoutVolume(workout), 0);

  const totalSets = history.reduce((sum, workout) => sum + getCompletedSets(workout), 0);
  const totalReps = history.reduce((sum, workout) => sum + getCompletedReps(workout), 0);
  const totalDurationSeconds = history.reduce((sum, workout) => sum + getDurationSeconds(workout), 0);

  const exerciseCounts = countBy(getAllExercises(history).map((exercise) => exercise.name));
  const muscleCounts = countBy(getAllMuscles(history));
  const workoutTitleCounts = countBy(history.map((workout) => workout.title));

  const averageDurationMinutes =
    totalWorkouts === 0 ? 0 : Math.round(totalDurationSeconds / totalWorkouts / 60);

  const averageVolumePerWorkout =
    totalWorkouts === 0 ? 0 : Math.round(totalVolume / totalWorkouts);

  const weeklyConsistencyPercent = Math.min(
    100,
    Math.round((week.length / 4) * 100),
  );

  return {
    totalWorkouts,
    weeklyWorkouts: week.length,
    monthlyWorkouts: month.length,

    totalVolume: Math.round(totalVolume),
    weeklyVolume: Math.round(weeklyVolume),
    monthlyVolume: Math.round(monthlyVolume),
    averageVolumePerWorkout,

    totalSets,
    totalReps,
    averageDurationMinutes,

    currentStreak: calculateCurrentStreak(history),
    longestStreak: calculateLongestStreak(history),
    weeklyConsistencyPercent,

    favouriteExercise: exerciseCounts[0]?.[0] || "Not enough data yet",
    mostTrainedMuscle: readableLabel(muscleCounts[0]?.[0]),
    mostCommonWorkout: workoutTitleCounts[0]?.[0] || "Not enough data yet",

    lastWorkout: history[0] || null,

    generatedAt: new Date().toISOString(),
  };
}

/**
 * ============================================================================
 * DEVELOPER NOTES
 * ============================================================================
 *
 * This engine should stay boring and predictable.
 *
 * No UI.
 * No localStorage.
 * No React.
 *
 * It should only:
 *
 * 1. read workout history
 * 2. calculate numbers
 * 3. return a plain object
 *
 * If a number looks wrong, check:
 *
 * HistoryRepository
 * ↓
 * this analytics engine
 * ↓
 * the page/card displaying the value
 *
 * ============================================================================
 */
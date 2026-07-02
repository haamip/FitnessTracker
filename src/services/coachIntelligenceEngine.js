/**
 * ============================================================================
 * TrackFit Coach Intelligence Engine
 * ============================================================================
 *
 * PURPOSE
 * -------
 * This file is the decision-making brain for the Coach Intelligence sandbox.
 *
 * It does not render UI.
 * It does not know CSS.
 * It does not touch localStorage directly.
 *
 * It reads clean data from repositories, calculates useful training signals,
 * then returns simple objects that the Coach cards can display.
 *
 * Difficulty
 * ----------
 * ⭐⭐⭐☆☆
 *
 * Why this exists
 * ---------------
 * Pages should stay small. Engines should do the thinking. Repositories own
 * the data. That keeps TrackFit commercial instead of becoming spaghetti.
 *
 * ============================================================================
 */

import {
  CardioRepository,
  CheckInRepository,
  HistoryRepository,
} from "./trackfitDataLayer";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKLY_WORKOUT_TARGET = 4;
const PROTEIN_TARGET = 170;
const WATER_TARGET = 3;
const SLEEP_TARGET = 7;

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function toDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetweenNow(value) {
  const date = toDate(value);
  if (!date) return null;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / DAY_MS));
}

function isWithinDays(value, days) {
  const date = toDate(value);
  if (!date) return false;
  return Date.now() - date.getTime() <= days * DAY_MS;
}

function getWorkoutVolume(workout) {
  if (Number.isFinite(Number(workout?.volume))) return Number(workout.volume);

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
  if (Number.isFinite(Number(workout?.completedSets))) return Number(workout.completedSets);

  return (workout?.exercises || []).reduce(
    (total, exercise) => total + (exercise.sets || []).filter((set) => set.done).length,
    0,
  );
}

function getDurationSeconds(workout) {
  return Number(workout?.durationSeconds || workout?.seconds || 0);
}

function getRecentWorkouts(history, days = 7) {
  return history.filter((workout) => isWithinDays(workout.completedAt, days));
}

function getLatestCheckIn(checkIns) {
  return checkIns[0] || null;
}

function getTrainingDays(history) {
  return new Set(
    history
      .map((workout) => toDate(workout.completedAt))
      .filter(Boolean)
      .map((date) => date.toISOString().slice(0, 10)),
  );
}

function countConsecutiveTrainingDays(history) {
  const trainingDays = getTrainingDays(history);
  let streak = 0;

  for (let offset = 0; offset < 14; offset += 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const key = date.toISOString().slice(0, 10);

    if (!trainingDays.has(key)) {
      if (offset === 0) continue;
      break;
    }

    streak += 1;
  }

  return streak;
}

function getPrimaryMusclesForWorkout(workout) {
  return [
    ...new Set(
      (workout?.exercises || [])
        .flatMap((exercise) => exercise.primaryMuscles || [])
        .filter(Boolean),
    ),
  ];
}

function getMostTrainedMuscle(week) {
  const muscleCounts = new Map();

  week.forEach((workout) => {
    getPrimaryMusclesForWorkout(workout).forEach((muscle) => {
      muscleCounts.set(muscle, (muscleCounts.get(muscle) || 0) + 1);
    });
  });

  const top = [...muscleCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  return top ? top[0].replaceAll("_", " ") : "Not enough data yet";
}

function getRecoveryScore(history) {
  const latestWorkout = history[0];
  const daysRested = daysBetweenNow(latestWorkout?.completedAt);

  if (daysRested === null) return 70;
  if (daysRested >= 3) return 95;
  if (daysRested === 2) return 84;
  if (daysRested === 1) return 72;
  return 58;
}

function getCheckInScore(checkIns) {
  const latest = getLatestCheckIn(checkIns);

  if (!latest) {
    return {
      score: 70,
      reason: "No check-in logged yet, so readiness is using training history only.",
    };
  }

  const sleepScore = clampScore((Number(latest.sleep || 0) / SLEEP_TARGET) * 100);
  const waterScore = clampScore((Number(latest.water || 0) / WATER_TARGET) * 100);
  const proteinScore = clampScore((Number(latest.protein || 0) / PROTEIN_TARGET) * 100);
  const score = Math.round((sleepScore * 0.45) + (waterScore * 0.25) + (proteinScore * 0.3));

  return {
    score,
    reason: `Latest check-in: ${latest.sleep || 0}h sleep, ${latest.water || 0}L water and ${latest.protein || 0}g protein.`,
  };
}

function getWeeklyLoadScore(week) {
  const sessions = week.length;

  if (sessions === 0) return 55;
  if (sessions <= 2) return 72;
  if (sessions <= 4) return 88;
  if (sessions === 5) return 76;
  return 62;
}

function getFatiguePenalty(history) {
  const consecutiveTrainingDays = countConsecutiveTrainingDays(history);
  const week = getRecentWorkouts(history, 7);
  const weeklyVolume = week.reduce((sum, workout) => sum + getWorkoutVolume(workout), 0);

  let penalty = 0;

  if (consecutiveTrainingDays >= 3) penalty += 12;
  if (consecutiveTrainingDays >= 5) penalty += 10;
  if (week.length > WEEKLY_WORKOUT_TARGET) penalty += (week.length - WEEKLY_WORKOUT_TARGET) * 4;
  if (weeklyVolume > 45000) penalty += 8;

  return penalty;
}

/**
 * Build Coach Dashboard
 * ---------------------
 * This is the only function the Coach Intelligence page needs to call.
 */
export function buildCoachDashboard() {
  const history = HistoryRepository.getAll();
  const checkIns = CheckInRepository.getAll();
  const cardio = CardioRepository.getAll();

  return {
    readiness: calculateReadiness(history, checkIns),
    weeklySummary: calculateWeeklySummary(history),
    fatigue: calculateFatigue(history, checkIns, cardio),
    recommendation: calculateRecommendation(history),
    plateau: detectPlateau(history),
    weeklyReview: calculateWeeklyReview(history, checkIns),
  };
}

function calculateReadiness(history, checkIns) {
  if (history.length === 0) {
    return {
      score: 70,
      status: "Baseline",
      reason: "Log a few workouts and check-ins so TrackFit can calculate real readiness.",
    };
  }

  const week = getRecentWorkouts(history, 7);
  const recoveryScore = getRecoveryScore(history);
  const checkIn = getCheckInScore(checkIns);
  const loadScore = getWeeklyLoadScore(week);
  const fatiguePenalty = getFatiguePenalty(history);
  const score = clampScore((recoveryScore * 0.4) + (checkIn.score * 0.35) + (loadScore * 0.25) - fatiguePenalty);
  const status = score >= 85 ? "Ready" : score >= 68 ? "Controlled" : score >= 50 ? "Caution" : "Recover";

  return {
    score,
    status,
    reason: `${checkIn.reason} Weekly load is ${week.length}/${WEEKLY_WORKOUT_TARGET} sessions.`,
  };
}

function calculateWeeklySummary(history) {
  const week = getRecentWorkouts(history, 7);
  const sessions = week.length;
  const volume = week.reduce((sum, workout) => sum + getWorkoutVolume(workout), 0);
  const sets = week.reduce((sum, workout) => sum + getCompletedSets(workout), 0);
  const durationMinutes = Math.round(
    week.reduce((sum, workout) => sum + getDurationSeconds(workout), 0) / 60,
  );
  const prs = week.reduce((sum, workout) => sum + (workout.prs?.length || 0), 0);
  const mostTrainedMuscle = getMostTrainedMuscle(week);

  const message = sessions === 0
    ? "No workouts logged in the last seven days. First session gets the engine moving."
    : `${sets} working sets, ${durationMinutes} minutes trained, ${prs} PR signals. Most trained: ${mostTrainedMuscle}.`;

  return {
    sessions,
    volume: Math.round(volume),
    sets,
    durationMinutes,
    prs,
    mostTrainedMuscle,
    message,
  };
}

function calculateFatigue(history, checkIns, cardio) {
  const week = getRecentWorkouts(history, 7);
  const recentCardio = cardio.filter((session) => isWithinDays(session.date, 7));
  const latestCheckIn = getLatestCheckIn(checkIns);
  const consecutiveTrainingDays = countConsecutiveTrainingDays(history);
  const weeklyVolume = week.reduce((sum, workout) => sum + getWorkoutVolume(workout), 0);
  const cardioMinutes = recentCardio.reduce((sum, session) => sum + Number(session.duration || 0), 0);
  const sleep = Number(latestCheckIn?.sleep || 0);

  let risk = 0;
  if (consecutiveTrainingDays >= 3) risk += 2;
  if (week.length > WEEKLY_WORKOUT_TARGET) risk += 2;
  if (weeklyVolume > 45000) risk += 2;
  if (cardioMinutes > 140) risk += 1;
  if (sleep > 0 && sleep < 6.5) risk += 2;

  if (risk >= 5) {
    return {
      level: "High",
      advice: "Fatigue is stacking up. Make today recovery, mobility or a lighter technique session.",
    };
  }

  if (risk >= 3) {
    return {
      level: "Medium",
      advice: "You can train, but keep the ego in the ute. Control volume and avoid junk sets.",
    };
  }

  return {
    level: "Low",
    advice: "No major fatigue flags. Good day for normal training if warm-ups feel strong.",
  };
}

function calculateRecommendation(history) {
  const latestWorkout = history[0];

  if (!latestWorkout) {
    return {
      workout: "Start Workout 1",
      route: "/workouts/workout-1",
      reason: "No completed workout history yet. Log one clean session to unlock better recommendations.",
    };
  }

  const trainedMuscles = getPrimaryMusclesForWorkout(latestWorkout);
  const trainedText = trainedMuscles.length > 0
    ? trainedMuscles.slice(0, 3).map((muscle) => muscle.replaceAll("_", " ")).join(", ")
    : "your last trained muscles";
  const latestTitle = latestWorkout.title || "last workout";

  if (latestTitle.toLowerCase().includes("upper") || trainedMuscles.includes("chest") || trainedMuscles.includes("shoulders")) {
    return {
      workout: "Lower Strength",
      route: "/workouts/demo-plan-lower-strength",
      reason: `Your latest session loaded ${trainedText}. Lower body is the cleaner rotation today.`,
    };
  }

  if (latestTitle.toLowerCase().includes("lower") || trainedMuscles.includes("quadriceps") || trainedMuscles.includes("glutes")) {
    return {
      workout: "Upper Strength",
      route: "/workouts/demo-plan-upper-strength",
      reason: `Your latest session loaded ${trainedText}. Upper body gives legs more recovery time.`,
    };
  }

  return {
    workout: latestTitle,
    route: `/workouts/${latestWorkout.workoutId || "workout-1"}`,
    reason: "Repeat a known session so TrackFit can compare performance properly.",
  };
}

function getBestEstimatedOneRepMax(exercise) {
  return (exercise.sets || [])
    .filter((set) => set.done)
    .map((set) => {
      const weight = Number.parseFloat(set.weight) || 0;
      const reps = Number.parseFloat(set.reps) || 0;
      return weight * (1 + reps / 30);
    })
    .sort((a, b) => b - a)[0] || 0;
}

function detectPlateau(history) {
  const exerciseMap = new Map();

  history.forEach((workout) => {
    (workout.exercises || []).forEach((exercise) => {
      const score = getBestEstimatedOneRepMax(exercise);
      if (!score) return;

      const entries = exerciseMap.get(exercise.name) || [];
      entries.push({
        date: workout.completedAt,
        score: Math.round(score * 10) / 10,
      });
      exerciseMap.set(exercise.name, entries);
    });
  });

  const plateau = [...exerciseMap.entries()]
    .map(([exercise, entries]) => ({
      exercise,
      entries: entries.sort((a, b) => new Date(b.date) - new Date(a.date)),
    }))
    .filter(({ entries }) => entries.length >= 3)
    .find(({ entries }) => {
      const recent = entries.slice(0, 3);
      const bestRecent = Math.max(...recent.map((entry) => entry.score));
      const oldestRecent = recent.at(-1).score;
      return bestRecent <= oldestRecent;
    });

  if (!plateau) {
    return {
      detected: false,
      message: "No plateaus detected yet. Keep stacking clean history.",
    };
  }

  return {
    detected: true,
    exercise: plateau.exercise,
    message: `${plateau.exercise} may be flattening out across the last 3 appearances. Try cleaner reps, a small deload, or a new rep range.`,
  };
}

function calculateWeeklyReview(history, checkIns) {
  const summary = calculateWeeklySummary(history);
  const latestCheckIn = getLatestCheckIn(checkIns);
  const consistencyScore = clampScore((summary.sessions / WEEKLY_WORKOUT_TARGET) * 100);
  const proteinScore = latestCheckIn
    ? clampScore((Number(latestCheckIn.protein || 0) / PROTEIN_TARGET) * 100)
    : 70;
  const score = clampScore((consistencyScore * 0.65) + (proteinScore * 0.35));

  return {
    score,
    message:
      score >= 85
        ? "Strong week. Training and recovery habits are lining up nicely."
        : score >= 65
          ? "Solid week. Tighten one habit and keep the training rhythm going."
          : "Quiet week. Get one clean session logged and rebuild momentum.",
  };
}

/**
 * ============================================================================
 * DEVELOPER NOTES
 * ============================================================================
 *
 * Debug order:
 *
 * 1. Developer Tools repository counts.
 * 2. HistoryRepository / CheckInRepository / CardioRepository JSON.
 * 3. This engine's returned object.
 * 4. Coach cards.
 *
 * Never start by guessing the UI is broken. Follow the data.
 *
 * ============================================================================
 */

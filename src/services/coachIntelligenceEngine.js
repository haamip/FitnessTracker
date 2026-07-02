/**
 * ============================================================================
 * TrackFit Coach Intelligence Engine
 * ============================================================================
 *
 * PURPOSE
 * -------
 * Makes coaching decisions from repository data and workout analytics.
 *
 * Difficulty
 * ----------
 * ⭐⭐⭐☆☆
 *
 * Data flow:
 *
 * Repositories
 * ↓
 * Workout Analytics Engine = numbers
 * ↓
 * Coach Intelligence Engine = decisions
 * ↓
 * Coach Cards = display
 *
 * ============================================================================
 */

import { buildWorkoutAnalytics } from "./workoutAnalyticsEngine";
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

function isWithinDays(value, days) {
  const date = toDate(value);
  if (!date) return false;
  return Date.now() - date.getTime() <= days * DAY_MS;
}

function getLatestCheckIn(checkIns) {
  return checkIns[0] || null;
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

  return {
    score: Math.round((sleepScore * 0.45) + (waterScore * 0.25) + (proteinScore * 0.3)),
    reason: `Latest check-in: ${latest.sleep || 0}h sleep, ${latest.water || 0}L water and ${latest.protein || 0}g protein.`,
  };
}

export function buildCoachDashboard() {
  const history = HistoryRepository.getAll();
  const checkIns = CheckInRepository.getAll();
  const cardio = CardioRepository.getAll();
  const analytics = buildWorkoutAnalytics(history);

  return {
    readiness: calculateReadiness(analytics, checkIns),
    weeklySummary: calculateWeeklySummary(analytics),
    fatigue: calculateFatigue(analytics, checkIns, cardio),
    recommendation: calculateRecommendation(history, analytics),
    plateau: detectPlateau(history),
    weeklyReview: calculateWeeklyReview(analytics, checkIns),
    analytics,
  };
}

function calculateReadiness(analytics, checkIns) {
  if (analytics.totalWorkouts === 0) {
    return {
      score: 70,
      status: "Baseline",
      reason: "Log a few workouts and check-ins so TrackFit can calculate real readiness.",
    };
  }

  const checkIn = getCheckInScore(checkIns);

  let loadScore = 70;
  if (analytics.weeklyWorkouts >= 3 && analytics.weeklyWorkouts <= 4) loadScore = 88;
  if (analytics.weeklyWorkouts > 4) loadScore = 68;
  if (analytics.weeklyWorkouts === 0) loadScore = 55;

  let fatiguePenalty = 0;
  if (analytics.weeklyWorkouts > WEEKLY_WORKOUT_TARGET) fatiguePenalty += 8;
  if (analytics.weeklyVolume > 45000) fatiguePenalty += 8;
  if (analytics.currentStreak >= 3) fatiguePenalty += 10;

  const score = clampScore(
    (checkIn.score * 0.45) +
      (loadScore * 0.35) +
      (analytics.weeklyConsistencyPercent * 0.2) -
      fatiguePenalty,
  );

  const status = score >= 85 ? "Ready" : score >= 68 ? "Controlled" : score >= 50 ? "Caution" : "Recover";

  return {
    score,
    status,
    reason: `${checkIn.reason} Weekly load is ${analytics.weeklyWorkouts}/${WEEKLY_WORKOUT_TARGET} sessions.`,
  };
}

function calculateWeeklySummary(analytics) {
  const message =
    analytics.weeklyWorkouts === 0
      ? "No workouts logged in the last seven days. First session gets the engine moving."
      : `${analytics.totalSets} total sets logged. This week: ${analytics.weeklyWorkouts} sessions and ${analytics.weeklyVolume.toLocaleString()}kg volume. Most trained: ${analytics.mostTrainedMuscle}.`;

  return {
    sessions: analytics.weeklyWorkouts,
    volume: analytics.weeklyVolume,
    sets: analytics.totalSets,
    durationMinutes: analytics.averageDurationMinutes * analytics.weeklyWorkouts,
    prs: 0,
    mostTrainedMuscle: analytics.mostTrainedMuscle,
    message,
  };
}

function calculateFatigue(analytics, checkIns, cardio) {
  const recentCardio = cardio.filter((session) => isWithinDays(session.date, 7));
  const latestCheckIn = getLatestCheckIn(checkIns);
  const cardioMinutes = recentCardio.reduce((sum, session) => sum + Number(session.duration || 0), 0);
  const sleep = Number(latestCheckIn?.sleep || 0);

  let risk = 0;

  if (analytics.currentStreak >= 3) risk += 2;
  if (analytics.weeklyWorkouts > WEEKLY_WORKOUT_TARGET) risk += 2;
  if (analytics.weeklyVolume > 45000) risk += 2;
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

function calculateRecommendation(history, analytics) {
  const latestWorkout = analytics.lastWorkout || history[0];

  if (!latestWorkout) {
    return {
      workout: "Start Workout 1",
      route: "/workouts/workout-1",
      reason: "No completed workout history yet. Log one clean session to unlock better recommendations.",
    };
  }

  const trainedMuscles = getPrimaryMusclesForWorkout(latestWorkout);
  const trainedText =
    trainedMuscles.length > 0
      ? trainedMuscles.slice(0, 3).map((muscle) => muscle.replaceAll("_", " ")).join(", ")
      : "your last trained muscles";

  const latestTitle = latestWorkout.title || "last workout";

  if (
    latestTitle.toLowerCase().includes("upper") ||
    trainedMuscles.includes("chest") ||
    trainedMuscles.includes("shoulders")
  ) {
    return {
      workout: "Lower Strength",
      route: "/workouts/demo-plan-lower-strength",
      reason: `Your latest session loaded ${trainedText}. Lower body is the cleaner rotation today.`,
    };
  }

  if (
    latestTitle.toLowerCase().includes("lower") ||
    trainedMuscles.includes("quadriceps") ||
    trainedMuscles.includes("glutes")
  ) {
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
  return (
    (exercise.sets || [])
      .filter((set) => set.done)
      .map((set) => {
        const weight = Number.parseFloat(set.weight) || 0;
        const reps = Number.parseFloat(set.reps) || 0;
        return weight * (1 + reps / 30);
      })
      .sort((a, b) => b - a)[0] || 0
  );
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

function calculateWeeklyReview(analytics, checkIns) {
  const latestCheckIn = getLatestCheckIn(checkIns);

  const consistencyScore = analytics.weeklyConsistencyPercent;

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
 * WorkoutAnalyticsEngine calculates numbers.
 * CoachIntelligenceEngine makes decisions.
 *
 * If something looks wrong:
 *
 * 1. Check HistoryRepository
 * 2. Check WorkoutAnalyticsEngine output
 * 3. Check this Coach engine
 * 4. Check the card rendering it
 *
 * ============================================================================
 */
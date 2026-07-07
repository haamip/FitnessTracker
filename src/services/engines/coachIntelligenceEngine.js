/**
 * ============================================================================
 * TrackFit Coach Intelligence Engine
 * ============================================================================
 *
 * PURPOSE
 * -------
 * Prepares coach-facing output from repositories and engine decisions.
 *
 * The Decision Engine makes the call.
 * Coach Intelligence shapes that call for UI, Developer Tools and future AI.
 *
 * ============================================================================
 */

import { buildDecisionEngine } from "./decisionEngine";
import { buildPrEngine } from "./prEngineV2";
import { buildProgressionEngine } from "./progressionEngine";
import { buildRecoveryEngine } from "./recoveryEngine";
import { buildWorkoutAnalytics } from "./workoutAnalyticsEngine";
import {
  CardioRepository,
  CheckInRepository,
  HistoryRepository,
  NutritionRepository,
} from "../repositories/trackfitDataLayer";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKLY_WORKOUT_TARGET = 4;

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function toNumber(value) {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : 0;
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

function getCheckInScore(checkIns) {
  const latest = getLatestCheckIn(checkIns);

  if (!latest) {
    return {
      score: 70,
      reason:
        "No check-in logged yet, so readiness is using training history only.",
    };
  }

  const sleep = toNumber(latest.sleepHours ?? latest.sleep);
  const water = toNumber(latest.waterL ?? latest.water);
  const protein = toNumber(latest.proteinG ?? latest.protein);

  const sleepScore = clampScore((sleep / 7) * 100);
  const waterScore = clampScore((water / 4) * 100);
  const proteinScore = clampScore((protein / 185) * 100);

  return {
    score: Math.round(
      sleepScore * 0.45 + waterScore * 0.25 + proteinScore * 0.3,
    ),
    reason: `Latest check-in: ${sleep}h sleep, ${water}L water and ${protein}g protein.`,
  };
}

function calculateReadiness(analytics, checkIns, decision) {
  if (analytics.totalWorkouts === 0) {
    return {
      score: decision.decisionScore,
      status: "Baseline",
      reason:
        "Log a few workouts and check-ins so TrackFit can calculate real readiness.",
    };
  }

  const checkIn = getCheckInScore(checkIns);

  let loadScore = 70;
  if (analytics.weeklyWorkouts >= 3 && analytics.weeklyWorkouts <= 4) {
    loadScore = 88;
  }
  if (analytics.weeklyWorkouts > 4) loadScore = 68;
  if (analytics.weeklyWorkouts === 0) loadScore = 55;

  let fatiguePenalty = 0;
  if (analytics.weeklyWorkouts > WEEKLY_WORKOUT_TARGET) fatiguePenalty += 8;
  if (analytics.weeklyVolume > 45000) fatiguePenalty += 8;
  if (analytics.currentStreak >= 3) fatiguePenalty += 10;

  const score = clampScore(
    checkIn.score * 0.3 +
      loadScore * 0.2 +
      analytics.weeklyConsistencyPercent * 0.15 +
      decision.decisionScore * 0.35 -
      fatiguePenalty,
  );

  const status =
    score >= 85
      ? "Ready"
      : score >= 68
        ? "Controlled"
        : score >= 50
          ? "Caution"
          : "Recover";

  return {
    score,
    status,
    reason: `${checkIn.reason} Decision engine says ${decision.trainingIntensity.toLowerCase()} with a ${decision.decisionScore}% score.`,
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
    durationMinutes:
      analytics.averageDurationMinutes * analytics.weeklyWorkouts,
    prs: 0,
    mostTrainedMuscle: analytics.mostTrainedMuscle,
    message,
  };
}

function calculateFatigue(analytics, checkIns, cardio) {
  const recentCardio = cardio.filter((session) =>
    isWithinDays(session.date, 7),
  );
  const latestCheckIn = getLatestCheckIn(checkIns);
  const cardioMinutes = recentCardio.reduce(
    (sum, session) =>
      sum +
      toNumber(session.durationMin ?? session.duration ?? session.minutes),
    0,
  );
  const sleep = toNumber(latestCheckIn?.sleepHours ?? latestCheckIn?.sleep);

  let risk = 0;

  if (analytics.currentStreak >= 3) risk += 2;
  if (analytics.weeklyWorkouts > WEEKLY_WORKOUT_TARGET) risk += 2;
  if (analytics.weeklyVolume > 45000) risk += 2;
  if (cardioMinutes > 140) risk += 1;
  if (sleep > 0 && sleep < 6.5) risk += 2;

  if (risk >= 5) {
    return {
      level: "High",
      advice:
        "Fatigue is stacking up. Make today recovery, mobility or a lighter technique session.",
    };
  }

  if (risk >= 3) {
    return {
      level: "Medium",
      advice:
        "You can train, but keep the ego in the ute. Control volume and avoid junk sets.",
    };
  }

  return {
    level: "Low",
    advice:
      "No major fatigue flags. Good day for normal training if warm-ups feel strong.",
  };
}

function mapDecisionToRecommendation(decision) {
  return {
    workout: decision.nextBestMove.title,
    route: decision.nextBestMove.route,
    reason: decision.nextBestMove.detail,
    action: decision.nextBestMove.action,
    intensity: decision.trainingIntensity,
    score: decision.decisionScore,
  };
}

function buildNutritionSummary(decision) {
  const signal = decision.signals.nutrition;

  return {
    score: signal.score,
    calories: signal.today.calories,
    protein: signal.today.protein,
    carbs: signal.today.carbs,
    fats: signal.today.fats,
    averageProtein: signal.averageProtein,
    daysWithFood: signal.daysWithFood,
    proteinTarget: signal.proteinTarget,
    calorieTarget: signal.calorieTarget,
    message:
      signal.today.protein >= signal.proteinTarget
        ? "Protein target is hit today."
        : `${Math.max(0, signal.proteinTarget - signal.today.protein)}g protein left today.`,
  };
}

function buildMovementSummary(decision) {
  const signal = decision.signals.movement;

  return {
    score: signal.score,
    steps: signal.today.steps,
    distanceKm: signal.today.distanceKm,
    durationMin: signal.today.durationMin,
    weeklyMinutes: signal.weeklyMinutes,
    stepTarget: signal.stepTarget,
    weeklyMinutesTarget: signal.weeklyMinutesTarget,
    message:
      signal.weeklyMinutes >= signal.weeklyMinutesTarget
        ? "Weekly movement target is on track."
        : `${Math.max(0, signal.weeklyMinutesTarget - signal.weeklyMinutes)} movement minutes left this week.`,
  };
}
function buildRecoveryHabitSummary(decision) {
  const signal = decision.signals.recoveryHabits;

  return {
    score: signal.score,
    hydrationScore: signal.hydrationScore,
    sleepScore: signal.sleepScore,
    averageWater: signal.averageWater,
    averageSleep: signal.averageSleep,
    latestWeight: signal.latestWeight,
    weightChange: signal.weightChange,
    checkInDays: signal.checkInDays,
    waterTarget: signal.waterTarget,
    sleepTarget: signal.sleepTarget,
    message:
      signal.averageSleep >= signal.sleepTarget &&
      signal.averageWater >= signal.waterTarget
        ? "Sleep and hydration are supporting recovery."
        : "Recovery habits need attention before pushing too hard.",
  };
}

function buildAdherenceSummary(decision) {
  const signal = decision.signals.adherence;

  return {
    score: signal.score,
    workoutScore: signal.workoutScore,
    nutritionLoggingScore: signal.nutritionLoggingScore,
    checkInScore: signal.checkInScore,
    movementScore: signal.movementScore,
    weeklyWorkoutTarget: signal.weeklyWorkoutTarget,
    message:
      signal.score >= 80
        ? "Adherence is strong across training, food, check-ins and movement."
        : signal.score >= 60
          ? "Adherence is decent, but one habit needs tightening."
          : "Adherence is patchy. Win the basics first.",
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

function calculateWeeklyReview(analytics, decision) {
  const consistencyScore = analytics.weeklyConsistencyPercent;
  const nutritionScore = decision.signals.nutrition.score;
  const movementScore = decision.signals.movement.score;

  const score = clampScore(
    consistencyScore * 0.5 + nutritionScore * 0.3 + movementScore * 0.2,
  );

  return {
    score,
    message:
      score >= 85
        ? "Strong week. Training, food and movement are lining up nicely."
        : score >= 65
          ? "Solid week. Tighten one habit and keep the training rhythm going."
          : "Quiet week. Get one clean session logged and rebuild momentum.",
  };
}

export function buildCoachDashboard() {
  const history = HistoryRepository.getAll();
  const checkIns = CheckInRepository.getAll();
  const cardio = CardioRepository.getAll();
  const nutrition = NutritionRepository.getAll();

  const analytics = buildWorkoutAnalytics(history);
  const prEngine = buildPrEngine(history);
  const progressionEngine = buildProgressionEngine(history);
  const recoveryEngine = buildRecoveryEngine(history, checkIns);

  const decision = buildDecisionEngine({
    history,
    checkIns,
    cardio,
    nutrition,
    analytics,
    prEngine,
    progressionEngine,
    recoveryEngine,
  });

  return {
    readiness: calculateReadiness(analytics, checkIns, decision),
    weeklySummary: calculateWeeklySummary(analytics),
    fatigue: calculateFatigue(analytics, checkIns, cardio),
    nutrition: buildNutritionSummary(decision),
    movement: buildMovementSummary(decision),
    recoveryHabits: buildRecoveryHabitSummary(decision),
    adherence: buildAdherenceSummary(decision),
    recommendation: mapDecisionToRecommendation(decision),
    decision,
    plateau: detectPlateau(history),
    weeklyReview: calculateWeeklyReview(analytics, decision),
    analytics,
  };
}

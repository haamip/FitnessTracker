/**
 * ============================================================================
 * TrackFit Decision Engine
 * ============================================================================
 *
 * PURPOSE
 * -------
 * Combines training, recovery, movement and nutrition signals into one coaching
 * decision.
 *
 * Data flow:
 *
 * Repositories
 * Engines
 * Decision Engine
 * Coach Intelligence / Developer Tools / future AI layer
 *
 * ============================================================================
 */

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
const PROTEIN_TARGET = 185;
const CALORIE_TARGET = 2600;
const STEP_TARGET = 10000;
const MOVEMENT_MINUTES_TARGET = 120;

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function toNumber(value) {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : 0;
}

function getDateOnly(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function isWithinDays(value, days) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() <= days * DAY_MS;
}

function getReadinessBand(score) {
  if (score >= 85) return "Green";
  if (score >= 70) return "Amber";
  if (score >= 50) return "Caution";
  return "Red";
}

function getTrainingIntensity(score) {
  if (score >= 85) return "Push";
  if (score >= 70) return "Build";
  if (score >= 50) return "Maintain";
  return "Recover";
}

function getProgressionScore(progressionEngine) {
  if (progressionEngine.totalExercisesAnalysed === 0) return 65;

  const improvingPoints = progressionEngine.improvingCount * 8;
  const stablePoints = progressionEngine.stableCount * 3;
  const decliningPenalty = progressionEngine.decliningCount * 10;

  return clampScore(65 + improvingPoints + stablePoints - decliningPenalty);
}

function getPrScore(prEngine) {
  if (prEngine.totalCompletedSetsAnalysed === 0) return 60;
  if (prEngine.totalCompletedSetsAnalysed >= 80) return 90;
  if (prEngine.totalCompletedSetsAnalysed >= 40) return 82;
  if (prEngine.totalCompletedSetsAnalysed >= 15) return 74;
  return 66;
}

function getConsistencyScore(analytics) {
  if (analytics.totalWorkouts === 0) return 55;
  return clampScore(analytics.weeklyConsistencyPercent);
}

function buildNutritionSignal(nutrition) {
  const today = new Date().toISOString().slice(0, 10);
  const todaysMeals = nutrition.filter(
    (meal) => getDateOnly(meal.date) === today,
  );

  const todayTotals = todaysMeals.reduce(
    (summary, meal) => ({
      calories: summary.calories + toNumber(meal.calories),
      protein: summary.protein + toNumber(meal.protein),
      carbs: summary.carbs + toNumber(meal.carbs),
      fats: summary.fats + toNumber(meal.fats),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 },
  );

  const recentMeals = nutrition.filter((meal) => isWithinDays(meal.date, 7));
  const recentProtein = recentMeals.reduce(
    (sum, meal) => sum + toNumber(meal.protein),
    0,
  );
  const daysWithFood = new Set(
    recentMeals.map((meal) => getDateOnly(meal.date)),
  ).size;
  const averageProtein =
    daysWithFood > 0 ? Math.round(recentProtein / daysWithFood) : 0;

  const proteinScore = clampScore((todayTotals.protein / PROTEIN_TARGET) * 100);
  const calorieScore =
    todayTotals.calories === 0
      ? 55
      : clampScore(100 - Math.abs(CALORIE_TARGET - todayTotals.calories) / 20);

  return {
    score: clampScore(proteinScore * 0.65 + calorieScore * 0.35),
    today: todayTotals,
    averageProtein,
    daysWithFood,
    proteinTarget: PROTEIN_TARGET,
    calorieTarget: CALORIE_TARGET,
  };
}

function buildMovementSignal(cardio) {
  const today = new Date().toISOString().slice(0, 10);
  const todaysMovement = cardio.filter(
    (session) => getDateOnly(session.date) === today,
  );
  const recentMovement = cardio.filter((session) =>
    isWithinDays(session.date, 7),
  );

  const todayTotals = todaysMovement.reduce(
    (summary, session) => ({
      steps: summary.steps + toNumber(session.steps),
      distanceKm:
        summary.distanceKm +
        toNumber(session.distanceKm ?? session.distance ?? session.km),
      durationMin:
        summary.durationMin +
        toNumber(session.durationMin ?? session.duration ?? session.minutes),
    }),
    { steps: 0, distanceKm: 0, durationMin: 0 },
  );

  const weeklyMinutes = recentMovement.reduce(
    (sum, session) =>
      sum +
      toNumber(session.durationMin ?? session.duration ?? session.minutes),
    0,
  );

  const stepScore = clampScore((todayTotals.steps / STEP_TARGET) * 100);
  const minutesScore = clampScore(
    (weeklyMinutes / MOVEMENT_MINUTES_TARGET) * 100,
  );

  return {
    score: clampScore(stepScore * 0.45 + minutesScore * 0.55),
    today: todayTotals,
    weeklyMinutes,
    stepTarget: STEP_TARGET,
    weeklyMinutesTarget: MOVEMENT_MINUTES_TARGET,
  };
}

function getDecisionScore({
  analytics,
  prEngine,
  progressionEngine,
  recoveryEngine,
  nutritionSignal,
  movementSignal,
}) {
  const consistencyScore = getConsistencyScore(analytics);
  const progressionScore = getProgressionScore(progressionEngine);
  const prScore = getPrScore(prEngine);
  const recoveryScore = recoveryEngine.recoveryScore || 0;

  return clampScore(
    recoveryScore * 0.3 +
      consistencyScore * 0.18 +
      progressionScore * 0.2 +
      prScore * 0.12 +
      nutritionSignal.score * 0.12 +
      movementSignal.score * 0.08,
  );
}

function getPrimaryLimiters({
  analytics,
  progressionEngine,
  recoveryEngine,
  nutritionSignal,
  movementSignal,
}) {
  const limiters = [];

  if (analytics.weeklyWorkouts === 0) {
    limiters.push("No workouts logged this week");
  }

  if (analytics.weeklyWorkouts > 4) {
    limiters.push("High weekly training frequency");
  }

  if (recoveryEngine.recoveryScore < 70) {
    limiters.push("Recovery score below normal training range");
  }

  if (progressionEngine.decliningCount > progressionEngine.improvingCount) {
    limiters.push("More exercises declining than improving");
  }

  if (recoveryEngine.trainingLoadPenalty > 0) {
    limiters.push("Training load penalty active");
  }

  if (
    nutritionSignal.today.protein > 0 &&
    nutritionSignal.today.protein < PROTEIN_TARGET * 0.75
  ) {
    limiters.push("Protein is low today");
  }

  if (nutritionSignal.daysWithFood < 4) {
    limiters.push("Nutrition logging is inconsistent");
  }

  if (movementSignal.weeklyMinutes < MOVEMENT_MINUTES_TARGET * 0.5) {
    limiters.push("Weekly movement is low");
  }

  return limiters;
}

function getOpportunities({
  analytics,
  prEngine,
  progressionEngine,
  recoveryEngine,
  nutritionSignal,
  movementSignal,
}) {
  const opportunities = [];

  if (recoveryEngine.recoveryScore >= 85) {
    opportunities.push("Recovery is strong enough for normal progression");
  }

  if (progressionEngine.strongestProgress) {
    opportunities.push(
      `${progressionEngine.strongestProgress.exercise} is trending up`,
    );
  }

  if (prEngine.bestOverallEstimatedOneRepMax) {
    opportunities.push(
      `${prEngine.bestOverallEstimatedOneRepMax.exercise} has the strongest estimated 1RM signal`,
    );
  }

  if (analytics.weeklyWorkouts > 0 && analytics.weeklyWorkouts <= 4) {
    opportunities.push("Weekly training frequency is inside the target range");
  }

  if (nutritionSignal.today.protein >= PROTEIN_TARGET) {
    opportunities.push("Protein target is hit today");
  }

  if (movementSignal.weeklyMinutes >= MOVEMENT_MINUTES_TARGET) {
    opportunities.push("Weekly movement target is on track");
  }

  return opportunities;
}

function getNextBestMove(
  {
    analytics,
    progressionEngine,
    recoveryEngine,
    nutritionSignal,
    movementSignal,
  },
  intensity,
) {
  if (analytics.totalWorkouts === 0) {
    return {
      title: "Start with one clean session",
      detail:
        "No completed workout history yet. Complete a simple session so TrackFit can start comparing real performance.",
      action: "Start Workout 1",
      route: "/workouts/workout-1",
    };
  }

  if (intensity === "Recover") {
    return {
      title: "Recovery day",
      detail:
        "Recovery is too low for heavy training. Use walking, mobility or light technique work today.",
      action: "Open movement",
      route: "/cardio",
    };
  }

  if (
    nutritionSignal.today.protein > 0 &&
    nutritionSignal.today.protein < PROTEIN_TARGET * 0.65
  ) {
    return {
      title: "Fuel first",
      detail:
        "Protein is low today. Hit a high-protein meal before pushing volume hard.",
      action: "Open food",
      route: "/nutrition",
    };
  }

  if (
    movementSignal.today.steps < 3000 &&
    movementSignal.weeklyMinutes < MOVEMENT_MINUTES_TARGET * 0.6
  ) {
    return {
      title: "Add easy movement",
      detail:
        "Movement is low. Add a 20 minute walk to support recovery and fat-loss consistency.",
      action: "Open movement",
      route: "/cardio",
    };
  }

  if (intensity === "Maintain") {
    return {
      title: "Controlled training day",
      detail:
        "Train, but keep load conservative and avoid chasing records until recovery improves.",
      action: "Open workouts",
      route: "/workouts",
    };
  }

  if (
    progressionEngine.strongestProgress &&
    recoveryEngine.recoveryScore >= 75
  ) {
    return {
      title: "Progressive overload opportunity",
      detail: `${progressionEngine.strongestProgress.exercise} is moving well. Add a small rep or load progression if warm-ups feel clean.`,
      action: "Open workouts",
      route: "/workouts",
    };
  }

  return {
    title: "Normal training day",
    detail:
      "Signals are stable. Run the next planned session and keep the log clean.",
    action: "Open workouts",
    route: "/workouts",
  };
}

function getCoachSummary(intensity, limiters) {
  if (intensity === "Push") {
    return "Green light. Recovery, training, food and movement support a strong session today.";
  }

  if (intensity === "Build") {
    return "Good to train. Build carefully and let warm-ups decide how hard you push.";
  }

  if (intensity === "Maintain") {
    return "Train controlled. The goal today is quality work and clean logging.";
  }

  const limiterText = limiters[0] ? ` Main limiter: ${limiters[0]}.` : "";
  return `Recovery first today.${limiterText}`;
}

export function buildDecisionEngine({
  history = HistoryRepository.getAll(),
  checkIns = CheckInRepository.getAll(),
  nutrition = NutritionRepository.getAll(),
  cardio = CardioRepository.getAll(),
  analytics = buildWorkoutAnalytics(history),
  prEngine = buildPrEngine(history),
  progressionEngine = buildProgressionEngine(history),
  recoveryEngine = buildRecoveryEngine(history, checkIns),
} = {}) {
  const nutritionSignal = buildNutritionSignal(nutrition);
  const movementSignal = buildMovementSignal(cardio);

  const decisionScore = getDecisionScore({
    analytics,
    prEngine,
    progressionEngine,
    recoveryEngine,
    nutritionSignal,
    movementSignal,
  });

  const readinessBand = getReadinessBand(decisionScore);
  const trainingIntensity = getTrainingIntensity(decisionScore);
  const limiters = getPrimaryLimiters({
    analytics,
    progressionEngine,
    recoveryEngine,
    nutritionSignal,
    movementSignal,
  });
  const opportunities = getOpportunities({
    analytics,
    prEngine,
    progressionEngine,
    recoveryEngine,
    nutritionSignal,
    movementSignal,
  });

  return {
    decisionScore,
    readinessBand,
    trainingIntensity,
    nextBestMove: getNextBestMove(
      {
        analytics,
        progressionEngine,
        recoveryEngine,
        nutritionSignal,
        movementSignal,
      },
      trainingIntensity,
    ),
    coachSummary: getCoachSummary(trainingIntensity, limiters),
    limiters,
    opportunities,
    signals: {
      analytics: {
        weeklyWorkouts: analytics.weeklyWorkouts,
        weeklyVolume: analytics.weeklyVolume,
        weeklyConsistencyPercent: analytics.weeklyConsistencyPercent,
      },
      pr: {
        totalExercisesTracked: prEngine.totalExercisesTracked,
        totalCompletedSetsAnalysed: prEngine.totalCompletedSetsAnalysed,
      },
      progression: {
        improvingCount: progressionEngine.improvingCount,
        stableCount: progressionEngine.stableCount,
        decliningCount: progressionEngine.decliningCount,
      },
      recovery: {
        recoveryScore: recoveryEngine.recoveryScore,
        status: recoveryEngine.status,
        trainingLoadPenalty: recoveryEngine.trainingLoadPenalty,
      },
      nutrition: nutritionSignal,
      movement: movementSignal,
    },
    generatedAt: new Date().toISOString(),
  };
}

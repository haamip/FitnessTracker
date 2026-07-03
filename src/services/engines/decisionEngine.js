/**
 * ============================================================================
 * TrackFit Decision Engine
 * ============================================================================
 *
 * PURPOSE
 * -------
 * Combines Analytics, PR, Progression and Recovery into one training decision.
 *
 * Why this exists
 * ---------------
 * Each engine owns a focused calculation. The Decision Engine is the layer that
 * turns those signals into a clear coaching call.
 *
 * Data flow:
 *
 * Repositories
 * Engines
 * Decision Engine
 * Coach Intelligence / Developer Tools / future app surfaces
 *
 * ============================================================================
 */

import { buildPrEngine } from "./prEngineV2";
import { buildProgressionEngine } from "./progressionEngine";
import { buildRecoveryEngine } from "./recoveryEngine";
import { buildWorkoutAnalytics } from "./workoutAnalyticsEngine";
import {
  CheckInRepository,
  HistoryRepository,
} from "../repositories/trackfitDataLayer";

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
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

function getDecisionScore({ analytics, prEngine, progressionEngine, recoveryEngine }) {
  const consistencyScore = getConsistencyScore(analytics);
  const progressionScore = getProgressionScore(progressionEngine);
  const prScore = getPrScore(prEngine);
  const recoveryScore = recoveryEngine.recoveryScore || 0;

  return clampScore(
    recoveryScore * 0.35 +
      consistencyScore * 0.25 +
      progressionScore * 0.25 +
      prScore * 0.15,
  );
}

function getPrimaryLimiters({ analytics, progressionEngine, recoveryEngine }) {
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

  return limiters;
}

function getOpportunities({ analytics, prEngine, progressionEngine, recoveryEngine }) {
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

  return opportunities;
}

function getNextBestMove({ analytics, progressionEngine, recoveryEngine }, intensity) {
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
        "Recovery is too low for hard loading. Use walking, mobility or light technique work today.",
      action: "Open workouts",
      route: "/workouts",
    };
  }

  if (intensity === "Maintain") {
    return {
      title: "Controlled training day",
      detail:
        "Train, but keep load conservative and avoid chasing PRs until recovery improves.",
      action: "Open workouts",
      route: "/workouts",
    };
  }

  if (progressionEngine.strongestProgress && recoveryEngine.recoveryScore >= 75) {
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

function getCoachSummary(decisionScore, intensity, limiters) {
  if (intensity === "Push") {
    return "Green light. Recovery and training signals support a strong session today.";
  }

  if (intensity === "Build") {
    return "Good to train. Build carefully and let warm-ups decide how hard you push.";
  }

  if (intensity === "Maintain") {
    return "Train controlled. The goal today is quality work, not ego lifting.";
  }

  const limiterText = limiters[0] ? ` Main limiter: ${limiters[0]}.` : "";
  return `Recovery first today.${limiterText}`;
}

export function buildDecisionEngine({
  history = HistoryRepository.getAll(),
  checkIns = CheckInRepository.getAll(),
  analytics = buildWorkoutAnalytics(history),
  prEngine = buildPrEngine(history),
  progressionEngine = buildProgressionEngine(history),
  recoveryEngine = buildRecoveryEngine(history, checkIns),
} = {}) {
  const decisionScore = getDecisionScore({
    analytics,
    prEngine,
    progressionEngine,
    recoveryEngine,
  });
  const readinessBand = getReadinessBand(decisionScore);
  const trainingIntensity = getTrainingIntensity(decisionScore);
  const limiters = getPrimaryLimiters({
    analytics,
    progressionEngine,
    recoveryEngine,
  });
  const opportunities = getOpportunities({
    analytics,
    prEngine,
    progressionEngine,
    recoveryEngine,
  });

  return {
    decisionScore,
    readinessBand,
    trainingIntensity,
    nextBestMove: getNextBestMove(
      { analytics, progressionEngine, recoveryEngine },
      trainingIntensity,
    ),
    coachSummary: getCoachSummary(decisionScore, trainingIntensity, limiters),
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
    },
    generatedAt: new Date().toISOString(),
  };
}

/**
 * ============================================================================
 * DEVELOPER NOTES
 * ============================================================================
 *
 * The Decision Engine should not calculate raw workout stats itself.
 * It should combine outputs from other engines and return one plain object.
 *
 * Keep it predictable:
 *
 * - no UI
 * - no React
 * - no direct localStorage calls except through repository-backed defaults
 * - no fancy Unicode in comments
 *
 * ============================================================================
 */

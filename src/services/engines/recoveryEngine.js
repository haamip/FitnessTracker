/**
 * ============================================================================
 * TrackFit Recovery Engine
 * ============================================================================
 *
 * PURPOSE
 * -------
 * Estimates how recovered the user is based on workout history and check-ins.
 *
 * Difficulty
 * ----------
 * 3/5
 *
 * Why this exists
 * ---------------
 * Progression tells us if training is improving.
 * Recovery tells us if today is the right time to push.
 *
 * ============================================================================
 */

import {
  CheckInRepository,
  HistoryRepository,
} from "../repositories/trackfitDataLayer";

const DAY_MS = 24 * 60 * 60 * 1000;

const MUSCLE_RECOVERY_HOURS = {
  chest: 48,
  shoulders: 48,
  triceps: 36,
  biceps: 36,
  lats: 48,
  middle_back: 48,
  lower_back: 72,
  quadriceps: 72,
  hamstrings: 72,
  glutes: 72,
};

function toDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function hoursSince(value) {
  const date = toDate(value);
  if (!date) return null;
  return Math.max(0, (Date.now() - date.getTime()) / (60 * 60 * 1000));
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getLatestCheckIn(checkIns) {
  return checkIns[0] || null;
}

function getMusclesFromWorkout(workout) {
  return [
    ...new Set(
      (workout?.exercises || [])
        .flatMap((exercise) => exercise.primaryMuscles || [])
        .filter(Boolean),
    ),
  ];
}

function calculateMuscleRecovery(history) {
  const muscleScores = {};

  Object.keys(MUSCLE_RECOVERY_HOURS).forEach((muscle) => {
    const latestWorkout = history.find((workout) =>
      getMusclesFromWorkout(workout).includes(muscle),
    );

    if (!latestWorkout) {
      muscleScores[muscle] = 100;
      return;
    }

    const hoursRecovered = hoursSince(latestWorkout.completedAt) || 0;
    const requiredHours = MUSCLE_RECOVERY_HOURS[muscle];

    muscleScores[muscle] = clampScore((hoursRecovered / requiredHours) * 100);
  });

  return muscleScores;
}

function calculateCheckInRecovery(checkIns) {
  const latest = getLatestCheckIn(checkIns);

  if (!latest) {
    return {
      score: 70,
      reason:
        "No check-in logged yet. Recovery is based on training history only.",
    };
  }

  const sleepScore = clampScore((Number(latest.sleep || 0) / 7) * 100);
  const waterScore = clampScore((Number(latest.water || 0) / 3) * 100);
  const proteinScore = clampScore((Number(latest.protein || 0) / 170) * 100);

  const score = clampScore(
    sleepScore * 0.5 + waterScore * 0.2 + proteinScore * 0.3,
  );

  return {
    score,
    reason: `Latest check-in: ${latest.sleep || 0}h sleep, ${latest.water || 0}L water, ${latest.protein || 0}g protein.`,
  };
}

function calculateTrainingLoadPenalty(history) {
  const recent = history.filter((workout) => {
    const date = toDate(workout.completedAt);
    if (!date) return false;
    return Date.now() - date.getTime() <= 7 * DAY_MS;
  });

  if (recent.length <= 4) return 0;
  if (recent.length === 5) return 8;
  return 15;
}

function getAverageMuscleRecovery(muscleRecovery) {
  const values = Object.values(muscleRecovery);

  if (values.length === 0) return 100;

  return Math.round(
    values.reduce((sum, score) => sum + score, 0) / values.length,
  );
}

function getStatus(score) {
  if (score >= 85) return "Recovered";
  if (score >= 70) return "Ready";
  if (score >= 50) return "Caution";
  return "Recover";
}

function getRecommendation(score, lowestMuscles) {
  if (score >= 85) {
    return "Recovery looks strong. A normal training session is appropriate if warm-ups feel good.";
  }

  if (score >= 70) {
    return `Train normally, but monitor ${lowestMuscles.join(", ")} during warm-ups.`;
  }

  if (score >= 50) {
    return `Recovery is mixed. Avoid hard loading for ${lowestMuscles.join(", ")} today.`;
  }

  return "Recovery is low. Prioritise rest, mobility, walking or a lighter technique session.";
}

export function buildRecoveryEngine(
  history = HistoryRepository.getAll(),
  checkIns = CheckInRepository.getAll(),
) {
  const muscleRecovery = calculateMuscleRecovery(history);
  const averageMuscleRecovery = getAverageMuscleRecovery(muscleRecovery);
  const checkInRecovery = calculateCheckInRecovery(checkIns);
  const trainingLoadPenalty = calculateTrainingLoadPenalty(history);

  const recoveryScore = clampScore(
    averageMuscleRecovery * 0.55 +
      checkInRecovery.score * 0.45 -
      trainingLoadPenalty,
  );

  const lowestMuscles = Object.entries(muscleRecovery)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([muscle]) => muscle.replaceAll("_", " "));

  return {
    recoveryScore,
    status: getStatus(recoveryScore),
    muscleRecovery,
    averageMuscleRecovery,
    checkInRecovery,
    trainingLoadPenalty,
    lowestMuscles,
    recommendation: getRecommendation(recoveryScore, lowestMuscles),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * ============================================================================
 * DEVELOPER NOTES
 * ============================================================================
 *
 * Recovery is an estimate, not a medical claim.
 *
 * It uses simple signals:
 *
 * - when muscles were last trained
 * - sleep
 * - water
 * - protein
 * - weekly training frequency
 *
 * ============================================================================
 */

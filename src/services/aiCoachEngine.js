import { getAllTimePRs } from "./prEngine";
import { getExerciseRecommendation } from "./progressionEngine";
import { calculateMuscleRecovery } from "./recoveryEngine";
import { readWorkoutHistory } from "./workoutEngine";
import { getWeeklyTrainingSummary } from "./workoutSummaryEngine";

const DEFAULT_GOALS = {
  weeklyWorkouts: 4,
  benchTargetKg: 140,
};

function readableMuscle(muscle) {
  return muscle.replaceAll("_", " ");
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatVolume(volume) {
  if (volume >= 1000) return `${Math.round(volume / 100) / 10}k kg`;
  return `${Math.round(volume)}kg`;
}

/**
 * Picks the workout the coach should suggest today.
 *
 * The current rule is intentionally conservative: if there is no history we
 * send the user to Workout 1; after history exists, we steer them toward the
 * last successful session so progression recommendations have useful context.
 */
export function getSuggestedWorkout(history = readWorkoutHistory()) {
  const latestWorkout = history[0];

  if (!latestWorkout) {
    return {
      title: "Start Workout 1",
      route: "/workouts/workout-1",
      reason: "No completed workout history yet. Log one clean session to unlock personalised targets.",
    };
  }

  return {
    title: `Repeat ${latestWorkout.title || "last session"}`,
    route: `/workouts/${latestWorkout.workoutId || "workout-1"}`,
    reason: "Repeating a known session gives TrackFit enough data to progress weight, reps and volume safely.",
  };
}

/**
 * Converts muscle recovery percentages into a single dashboard score.
 *
 * This is not medical recovery. It is a practical training-readiness estimate
 * based on the muscles recently loaded in completed workouts.
 */
export function calculateTrainingReadiness(history = readWorkoutHistory()) {
  const recovery = calculateMuscleRecovery(history);

  if (recovery.length === 0) {
    return {
      score: 70,
      label: "Baseline",
      note: "TrackFit needs a few logged workouts before recovery becomes personalised.",
      muscles: [],
    };
  }

  const average = recovery.reduce((sum, item) => sum + item.score, 0) / recovery.length;
  const mostFatigued = recovery[0];
  const readyMuscles = recovery.filter((item) => item.score >= 85).slice(0, 3);

  return {
    score: clampScore(average),
    label: average >= 85 ? "Ready" : average >= 65 ? "Controlled" : "Recovering",
    note:
      mostFatigued.score < 60
        ? `${readableMuscle(mostFatigued.muscle)} is still recovering. Keep volume sensible or train around it.`
        : readyMuscles.length > 0
          ? `${readyMuscles.map((item) => readableMuscle(item.muscle)).join(", ")} look ready to train.`
          : "Recovery is building. Train clean reps and avoid ego lifting today.",
    muscles: recovery.slice(0, 8),
  };
}

/**
 * Looks for repeated flat performance on the same exercise.
 *
 * Plateau detection is deliberately simple for v0.7: if the best estimated 1RM
 * for an exercise has not improved across several appearances, the coach flags
 * it for attention rather than pretending to know the perfect fix.
 */
export function detectPlateaus(history = readWorkoutHistory(), minimumAppearances = 3) {
  const byExercise = new Map();

  history.forEach((workout) => {
    (workout.exercises || []).forEach((exercise) => {
      const bestSet = (exercise.sets || [])
        .filter((set) => set.done)
        .map((set) => {
          const weight = Number.parseFloat(set.weight) || 0;
          const reps = Number.parseFloat(set.reps) || 0;
          return weight * (1 + reps / 30);
        })
        .sort((a, b) => b - a)[0];

      if (!bestSet) return;

      const entries = byExercise.get(exercise.name) || [];
      entries.push({ completedAt: workout.completedAt, score: Math.round(bestSet * 10) / 10 });
      byExercise.set(exercise.name, entries);
    });
  });

  return [...byExercise.entries()]
    .map(([exercise, entries]) => ({
      exercise,
      entries: entries.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)),
    }))
    .filter(({ entries }) => entries.length >= minimumAppearances)
    .map(({ exercise, entries }) => {
      const recent = entries.slice(0, minimumAppearances);
      const bestRecent = Math.max(...recent.map((entry) => entry.score));
      const oldestRecent = recent.at(-1).score;
      const improved = bestRecent > oldestRecent;

      return {
        exercise,
        improved,
        bestRecent,
        message: improved
          ? `${exercise} is still trending up.`
          : `${exercise} may be flattening out. Consider a small variation, extra recovery, or repeating the load with cleaner reps.`,
      };
    })
    .filter((item) => !item.improved)
    .slice(0, 3);
}

/**
 * Builds the headline coaching recommendation shown on Dashboard and Coach.
 *
 * The coach uses deterministic local data first. That gives users a clear,
 * explainable recommendation before we add any external AI calls later.
 */
export function generateDailyCoachBrief(history = readWorkoutHistory(), goals = DEFAULT_GOALS) {
  const weeklySummary = getWeeklyTrainingSummary(history);
  const readiness = calculateTrainingReadiness(history);
  const suggestedWorkout = getSuggestedWorkout(history);
  const plateaus = detectPlateaus(history);
  const prs = getAllTimePRs(history);
  const bestBench = prs.find((pr) => pr.exercise.toLowerCase().includes("bench"));
  const benchProgress = bestBench
    ? clampScore((Number(bestBench.e1rm) / goals.benchTargetKg) * 100)
    : 0;

  const reasons = [
    suggestedWorkout.reason,
    readiness.note,
    weeklySummary.workouts >= goals.weeklyWorkouts
      ? `Weekly target hit: ${weeklySummary.workouts}/${goals.weeklyWorkouts} workouts.`
      : `Weekly target: ${weeklySummary.workouts}/${goals.weeklyWorkouts} workouts completed.`,
  ];

  if (plateaus[0]) reasons.push(plateaus[0].message);

  return {
    title: readiness.score >= 85 ? "Good day to push" : readiness.score >= 65 ? "Train smart today" : "Recovery-first session",
    readiness,
    suggestedWorkout,
    weeklySummary,
    plateaus,
    prs,
    benchGoal: {
      current: bestBench?.e1rm || 0,
      target: goals.benchTargetKg,
      percent: benchProgress,
    },
    reasons,
    primaryAction: history.length === 0 ? "Log your first workout" : "Open suggested workout",
    weeklySummaryText:
      weeklySummary.workouts === 0
        ? "No completed workouts this week yet. First session gets the engine moving."
        : `${weeklySummary.workouts} workouts, ${formatVolume(weeklySummary.totalVolume)} volume and ${weeklySummary.totalPrs} PR signals this week.`,
  };
}

/**
 * Explains the next set recommendation for an exercise.
 *
 * This is used by future “Why?” buttons so TrackFit does not become a black-box
 * coach. Users should be able to see the reasoning behind every suggestion.
 */
export function explainExerciseProgression(exercise, history = readWorkoutHistory()) {
  const recommendation = getExerciseRecommendation(exercise, history);

  return {
    exercise: exercise.name,
    reason: recommendation.reason,
    hasHistory: Boolean(recommendation.previousExercise),
    targets: recommendation.targets,
  };
}

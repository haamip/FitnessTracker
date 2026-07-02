import { exerciseLibrary } from "../../data/exerciseLibrary";
import { estimateOneRepMax } from "../prEngine";
import { calculateSetVolume } from "../workoutEngine";

/**
 * TrackFit v0.6 exercise intelligence helpers.
 *
 * The UI should not have to calculate exercise history, alternatives or coach
 * copy inside React components. Keeping that logic here means the same exercise
 * detail screen, AI Coach and future muscle-map features can all reuse it.
 */

function normalise(value) {
  return String(value || "")
    .toLowerCase()
    .trim();
}

/**
 * Finds one exercise from the imported TrackFit library.
 *
 * We support both id and slug because routes are human-readable while saved
 * workouts usually store libraryId.
 */
export function findExerciseById(id) {
  const wanted = normalise(id);

  return (
    exerciseLibrary.find(
      (exercise) => exercise.id === wanted || exercise.slug === wanted,
    ) || null
  );
}

/**
 * Returns exercises that are close enough to be useful alternatives.
 *
 * Priority is movement pattern first, then primary muscle. That is important:
 * replacing Bench Press with Cable Fly is not the same as replacing it with
 * Dumbbell Bench, even though both involve chest.
 */
export function getExerciseAlternatives(exercise, limit = 5) {
  if (!exercise) return [];

  const primaryMuscles = new Set(
    (exercise.primaryMuscles || []).map(normalise),
  );
  const movementPattern = normalise(exercise.movementPattern);

  return exerciseLibrary
    .filter((candidate) => candidate.id !== exercise.id)
    .map((candidate) => {
      const candidateMuscles = (candidate.primaryMuscles || []).map(normalise);
      const samePattern =
        movementPattern &&
        normalise(candidate.movementPattern) === movementPattern;
      const sharedMuscles = candidateMuscles.filter((muscle) =>
        primaryMuscles.has(muscle),
      ).length;

      return {
        exercise: candidate,
        score: (samePattern ? 4 : 0) + sharedMuscles,
      };
    })
    .filter((item) => item.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || a.exercise.name.localeCompare(b.exercise.name),
    )
    .slice(0, limit)
    .map((item) => item.exercise);
}

/**
 * Builds stats for a single exercise from workout history.
 *
 * This powers the exercise detail page and becomes the foundation for future
 * AI Coach statements like "Bench has stalled" or "hamstring volume is low".
 */
export function getExerciseHistoryStats(history, exercise) {
  if (!exercise) {
    return {
      sessions: 0,
      totalVolume: 0,
      bestSet: null,
      bestE1rm: 0,
      lastSession: null,
      recentSets: [],
    };
  }

  const key = exercise.id;
  const matchingSessions = [];
  const allSets = [];

  history.forEach((workout) => {
    const matches = (workout.exercises || []).filter((item) => {
      const itemKey = item.libraryId || item.id;
      return itemKey === key || item.name === exercise.name;
    });

    if (matches.length === 0) return;

    const sessionSets = matches
      .flatMap((item) => item.sets || [])
      .filter((set) => set.done);
    const sessionVolume = sessionSets.reduce(
      (sum, set) => sum + calculateSetVolume(set),
      0,
    );

    matchingSessions.push({
      workoutTitle: workout.title,
      completedAt: workout.completedAt,
      volume: sessionVolume,
      sets: sessionSets,
    });

    allSets.push(...sessionSets);
  });

  const bestSet = allSets.reduce((best, set) => {
    const e1rm = estimateOneRepMax(set.weight, set.reps);
    if (!best || e1rm > best.e1rm) {
      return {
        weight: set.weight,
        reps: set.reps,
        e1rm,
        volume: calculateSetVolume(set),
      };
    }

    return best;
  }, null);

  return {
    sessions: matchingSessions.length,
    totalVolume: allSets.reduce((sum, set) => sum + calculateSetVolume(set), 0),
    bestSet,
    bestE1rm: bestSet?.e1rm || 0,
    lastSession: matchingSessions[0] || null,
    recentSets: allSets.slice(0, 8),
  };
}

/**
 * Generates useful training tips from library metadata.
 *
 * These are not pretending to be medical advice. They are simple coaching cues
 * so the exercise detail screen feels educational even before TrackFit has its
 * own branded content for every exercise.
 */
export function getCoachTips(exercise) {
  const pattern = normalise(exercise?.movementPattern);
  const primary = (exercise?.primaryMuscles || []).map(normalise);

  const tips = [
    "Use a controlled tempo and own every rep before adding load.",
    "Stop the set if pain changes your technique.",
  ];

  if (pattern.includes("push")) {
    tips.unshift(
      "Keep the shoulder blades controlled and avoid bouncing reps.",
    );
  }

  if (pattern.includes("pull")) {
    tips.unshift(
      "Start each rep by setting the shoulder, then pull with the back.",
    );
  }

  if (pattern === "squat") {
    tips.unshift(
      "Brace before each rep and keep pressure through the whole foot.",
    );
  }

  if (pattern === "hinge") {
    tips.unshift(
      "Push the hips back and keep the spine locked in a neutral position.",
    );
  }

  if (primary.includes("abdominals")) {
    tips.unshift("Move slow enough that the abs do the work, not momentum.");
  }

  return tips.slice(0, 4);
}

/**
 * Common mistakes are pattern-based so v0.6 has useful guidance immediately.
 * Later we can replace these with exercise-specific TrackFit coaching notes.
 */
export function getCommonMistakes(exercise) {
  const pattern = normalise(exercise?.movementPattern);

  if (pattern.includes("push")) {
    return [
      "Losing shoulder position",
      "Cutting the range short",
      "Rushing the lowering phase",
    ];
  }

  if (pattern.includes("pull")) {
    return [
      "Yanking with momentum",
      "Shrugging every rep",
      "Not controlling the return",
    ];
  }

  if (pattern === "squat") {
    return [
      "Knees collapsing inward",
      "Heels lifting",
      "Relaxing the brace between reps",
    ];
  }

  if (pattern === "hinge") {
    return [
      "Turning it into a squat",
      "Rounding the lower back",
      "Letting the weight drift forward",
    ];
  }

  return [
    "Going too heavy too soon",
    "Using momentum",
    "Ignoring technique breakdown",
  ];
}

export function formatKg(value) {
  const number = Number.parseFloat(value) || 0;
  return `${Math.round(number)}kg`;
}

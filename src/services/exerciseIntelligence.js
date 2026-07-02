// ============================================================================
// TrackFit Exercise Intelligence
// ----------------------------------------------------------------------------
// Provides safe, lightweight exercise intelligence helpers on top of the
// Exercise Resolver. This service is intentionally pure and side-effect free so
// it can be imported by the Workout Builder, Coach, Progress, Recovery and later
// Nutrition Intelligence without freezing the UI or touching React state.
// ============================================================================

import { exerciseLibrary } from "../data/exerciseLibrary";
import {
  resolveExercise,
  slugifyExercise,
  normaliseExerciseText,
} from "./exerciseResolver";

/**
 * Movement families used by TrackFit's training logic.
 *
 * These values become the shared language between Workout Builder, Coach,
 * Progress, Recovery and future Nutrition Intelligence.
 */
export const MOVEMENT_FAMILIES = {
  horizontal_push: {
    label: "Horizontal Push",
    priorityMuscles: ["chest", "triceps", "shoulders"],
    trainingRole: "push strength and chest volume",
  },
  incline_push: {
    label: "Incline Push",
    priorityMuscles: ["upper chest", "front delts", "triceps"],
    trainingRole: "upper chest and shoulder-biased pressing",
  },
  vertical_push: {
    label: "Vertical Push",
    priorityMuscles: ["shoulders", "triceps"],
    trainingRole: "overhead pressing strength",
  },
  horizontal_pull: {
    label: "Horizontal Pull",
    priorityMuscles: ["back", "lats", "rear delts", "biceps"],
    trainingRole: "row strength and upper-back volume",
  },
  vertical_pull: {
    label: "Vertical Pull",
    priorityMuscles: ["lats", "back", "biceps"],
    trainingRole: "pull-up and pulldown strength",
  },
  squat: {
    label: "Squat Pattern",
    priorityMuscles: ["quadriceps", "glutes", "core"],
    trainingRole: "knee-dominant lower-body strength",
  },
  hinge: {
    label: "Hinge Pattern",
    priorityMuscles: ["hamstrings", "glutes", "back"],
    trainingRole: "posterior-chain strength",
  },
  lunge: {
    label: "Single-Leg Pattern",
    priorityMuscles: ["quadriceps", "glutes", "hamstrings"],
    trainingRole: "single-leg strength and balance",
  },
  elbow_flexion: {
    label: "Elbow Flexion",
    priorityMuscles: ["biceps", "forearms"],
    trainingRole: "biceps and arm volume",
  },
  elbow_extension: {
    label: "Elbow Extension",
    priorityMuscles: ["triceps"],
    trainingRole: "triceps and lockout strength",
  },
  shoulder_isolation: {
    label: "Shoulder Isolation",
    priorityMuscles: ["shoulders", "rear delts"],
    trainingRole: "shoulder shape and stability",
  },
  trap_isolation: {
    label: "Trap Isolation",
    priorityMuscles: ["traps", "upper back"],
    trainingRole: "trap and upper-back volume",
  },
  calf_raise: {
    label: "Calf Raise",
    priorityMuscles: ["calves"],
    trainingRole: "calf strength and volume",
  },
  core: {
    label: "Core",
    priorityMuscles: ["abdominals", "core", "hip flexors"],
    trainingRole: "trunk strength and bracing",
  },
  conditioning: {
    label: "Conditioning",
    priorityMuscles: ["cardio", "full body"],
    trainingRole: "fitness and work capacity",
  },
  unknown: {
    label: "General Exercise",
    priorityMuscles: [],
    trainingRole: "general training",
  },
};

/**
 * Normalises an equipment selection so user-facing values and library values can
 * be compared consistently.
 */
export function normaliseEquipment(value) {
  const text = normaliseExerciseText(value);

  if (text.includes("dumbbell")) return "dumbbell";
  if (text.includes("barbell")) return "barbell";
  if (text.includes("cable")) return "cable";
  if (text.includes("machine")) return "machine";
  if (text.includes("smith")) return "smith";
  if (text.includes("body")) return "body only";
  if (text.includes("band")) return "band";
  if (text.includes("kettlebell")) return "kettlebell";

  return text;
}

/**
 * Resolves one exercise into TrackFit's shared intelligence shape.
 *
 * This is the preferred API for new systems. It keeps raw exercise records away
 * from the rest of the app and gives future features a stable contract.
 */
export function getExerciseProfile(exercise) {
  const resolved = resolveExercise(exercise);
  const movement =
    MOVEMENT_FAMILIES[resolved.movementPattern] || MOVEMENT_FAMILIES.unknown;
  const muscles = [
    ...new Set([
      ...(resolved.primaryMuscles || []),
      ...(resolved.secondaryMuscles || []),
    ]),
  ];

  return {
    id: resolved.canonicalId,
    sourceId:
      resolved.libraryExercise?.id || exercise?.id || resolved.canonicalId,
    displayName: resolved.displayName,
    image: resolved.image,
    imageKey: resolved.imageKey,
    movementPattern: resolved.movementPattern,
    movementLabel: movement.label,
    trainingRole: movement.trainingRole,
    primaryMuscles: resolved.primaryMuscles || [],
    secondaryMuscles: resolved.secondaryMuscles || [],
    muscles,
    equipment: resolved.equipment || [],
    libraryExercise: resolved.libraryExercise || null,
  };
}

/**
 * Builds a resolved version of the exercise library.
 *
 * The result is memoised at module level by JavaScript module caching. We do not
 * store this in React state and we do not recalculate it on every render.
 */
export function getResolvedExerciseLibrary() {
  return exerciseLibrary.map((exercise) => ({
    ...exercise,
    intelligence: getExerciseProfile(exercise),
  }));
}

/**
 * Returns the best display label for a movement pattern.
 */
export function getMovementLabel(movementPattern) {
  return (MOVEMENT_FAMILIES[movementPattern] || MOVEMENT_FAMILIES.unknown)
    .label;
}

/**
 * Checks whether an exercise can reasonably be used with a selected equipment
 * mode from the Workout Builder.
 */
export function exerciseMatchesEquipment(exercise, equipmentMode = "full gym") {
  if (equipmentMode === "full gym") return true;

  const profile = getExerciseProfile(exercise);
  const equipment = profile.equipment.map(normaliseEquipment);

  if (equipmentMode === "dumbbells") {
    return equipment.includes("dumbbell") || equipment.includes("body only");
  }

  if (equipmentMode === "home") {
    return (
      equipment.includes("body only") ||
      equipment.includes("dumbbell") ||
      equipment.includes("band")
    );
  }

  return true;
}

/**
 * Returns true when an exercise is appropriate for the selected injury focus.
 *
 * This is intentionally conservative. It does not replace medical advice; it
 * simply stops the builder from selecting obvious aggravators.
 */
export function exerciseMatchesInjuryFocus(exercise, injuryFocus = "none") {
  if (injuryFocus === "none") return true;

  const profile = getExerciseProfile(exercise);
  const name = normaliseExerciseText(exercise?.name || profile.displayName);

  if (injuryFocus === "shoulder") {
    return (
      profile.movementPattern !== "vertical_push" &&
      !name.includes("behind neck")
    );
  }

  if (injuryFocus === "knee") {
    return (
      profile.movementPattern !== "squat" ||
      name.includes("bodyweight") ||
      name.includes("box")
    );
  }

  if (injuryFocus === "lower_back") {
    return (
      profile.movementPattern !== "hinge" ||
      name.includes("glute") ||
      name.includes("dumbbell")
    );
  }

  return true;
}

/**
 * Scores an exercise against a requested movement slot.
 *
 * This scoring function is deterministic and cheap. It is safe to call in loops
 * over the exercise library because it performs no async work and no state
 * updates.
 */
export function scoreExerciseForSlot(exercise, slot, options = {}) {
  const {
    equipment = "full gym",
    injuryFocus = "none",
    usedCanonicalIds = new Set(),
    usedSourceIds = new Set(),
  } = options;
  const profile = getExerciseProfile(exercise);

  let score = 0;

  if (profile.movementPattern === slot) score += 100;
  if (profile.id === slot) score += 20;
  if (exerciseMatchesEquipment(exercise, equipment)) score += 25;
  if (exerciseMatchesInjuryFocus(exercise, injuryFocus)) score += 20;

  if (usedCanonicalIds.has(profile.id)) score -= 60;
  if (usedSourceIds.has(exercise.id)) score -= 200;

  if ((exercise.difficulty || "").toLowerCase() === "beginner") score += 3;

  return score;
}

/**
 * Picks the best exercise for a requested movement slot.
 */
export function pickBestExerciseForSlot(slot, options = {}) {
  let bestExercise = null;
  let bestScore = -Infinity;

  for (const exercise of exerciseLibrary) {
    const score = scoreExerciseForSlot(exercise, slot, options);

    if (score > bestScore) {
      bestExercise = exercise;
      bestScore = score;
    }
  }

  return bestExercise || exerciseLibrary[0];
}

/**
 * Creates a compact movement summary from a list of exercise-like objects.
 *
 * The Coach and Progress pages can use this later to explain training balance.
 */
export function summariseMovements(exercises = []) {
  return exercises.reduce((summary, exercise) => {
    const profile = getExerciseProfile(exercise);
    const key = profile.movementPattern || "unknown";

    summary[key] = summary[key] || {
      movementPattern: key,
      label: getMovementLabel(key),
      count: 0,
      muscles: new Set(),
    };

    summary[key].count += 1;
    profile.muscles.forEach((muscle) => summary[key].muscles.add(muscle));

    return summary;
  }, {});
}

/**
 * Converts movement summaries into serialisable objects for UI/analytics.
 */
export function serialiseMovementSummary(summary) {
  return Object.values(summary).map((item) => ({
    movementPattern: item.movementPattern,
    label: item.label,
    count: item.count,
    muscles: [...item.muscles],
  }));
}

/**
 * Creates a stable key for external systems that need a safe exercise identifier.
 */
export function createExerciseIntelligenceKey(exercise) {
  const profile = getExerciseProfile(exercise);
  return profile.id || slugifyExercise(profile.displayName);
}

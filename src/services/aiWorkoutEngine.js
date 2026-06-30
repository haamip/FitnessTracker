// ============================================================================
// TrackFit Workout Builder Engine
// ----------------------------------------------------------------------------
// Stable deterministic generator used by the public Workout Builder.
//
// Important rule:
// This engine must stay lightweight because AIWorkoutBuilder.jsx calls
// generateWorkoutPlan() inside useMemo. Anything expensive here can lock the
// browser main thread and make the page look frozen with no console error.
//
// The Exercise Intelligence layer will be integrated in smaller tested steps.
// For now this file uses the current exerciseLibrary directly and keeps the
// generation path simple, predictable and fast.
// ============================================================================

import { exerciseLibrary } from "../data/exerciseLibrary";

/**
 * Public labels used by the Workout Builder UI.
 */
export const equipmentLabels = {
  "full gym": "Full Gym",
  dumbbells: "Dumbbells",
  home: "Home / Minimal Kit",
};

/**
 * Movement slots for each high-level training goal.
 *
 * These templates describe the shape of a session first, then the engine picks
 * real exercises from the library that match each movement pattern.
 */
const splitTemplates = {
  muscle: [
    {
      name: "Upper A",
      slots: ["horizontal_push", "horizontal_pull", "vertical_push", "vertical_pull", "elbow_flexion", "elbow_extension"],
    },
    {
      name: "Lower A",
      slots: ["squat", "hinge", "lunge", "calf_raise", "core"],
    },
    {
      name: "Upper B",
      slots: ["horizontal_push", "horizontal_pull", "vertical_push", "vertical_pull", "elbow_flexion", "elbow_extension"],
    },
    {
      name: "Lower B",
      slots: ["hinge", "squat", "lunge", "core", "conditioning"],
    },
  ],
  strength: [
    {
      name: "Heavy Upper",
      slots: ["horizontal_push", "horizontal_pull", "vertical_push", "vertical_pull"],
    },
    {
      name: "Heavy Lower",
      slots: ["squat", "hinge", "squat", "core"],
    },
    {
      name: "Bench Focus",
      slots: ["horizontal_push", "horizontal_push", "horizontal_pull", "elbow_extension"],
    },
    {
      name: "Deadlift Focus",
      slots: ["hinge", "squat", "horizontal_pull", "core"],
    },
  ],
  fatloss: [
    {
      name: "Full Body Strength",
      slots: ["squat", "horizontal_push", "horizontal_pull", "hinge", "conditioning"],
    },
    {
      name: "Conditioning Circuit",
      slots: ["conditioning", "squat", "horizontal_push", "core"],
    },
    {
      name: "Upper Circuit",
      slots: ["horizontal_push", "horizontal_pull", "vertical_push", "vertical_pull", "core"],
    },
    {
      name: "Lower Circuit",
      slots: ["squat", "hinge", "lunge", "core", "conditioning"],
    },
  ],
};

/**
 * Returns the default training prescription for the selected user goal.
 */
export function goalPrescription(goal, level) {
  if (goal === "strength") {
    return {
      sets: level === "beginner" ? 3 : 4,
      reps: "4-6",
      rest: "120 sec",
      note: "Heavy work. Longer rests. Add load slowly.",
    };
  }

  if (goal === "fatloss") {
    return {
      sets: level === "beginner" ? 2 : 3,
      reps: "10-15",
      rest: "45-60 sec",
      note: "Controlled pace. Keep the heart rate up.",
    };
  }

  return {
    sets: level === "beginner" ? 2 : 3,
    reps: "8-12",
    rest: "60-90 sec",
    note: "Muscle-building range. Chase quality reps.",
  };
}

/**
 * Converts free-form equipment values into a consistent comparison string.
 */
function normaliseEquipment(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Returns true when an exercise matches the selected equipment mode.
 */
function equipmentMatches(exercise, equipmentMode) {
  if (equipmentMode === "full gym") {
    return true;
  }

  const exerciseEquipment = (exercise.equipment || [])
    .map(normaliseEquipment)
    .join(" ");

  if (equipmentMode === "dumbbells") {
    return exerciseEquipment.includes("dumbbell") || exerciseEquipment.includes("body only");
  }

  if (equipmentMode === "home") {
    return (
      exerciseEquipment.includes("body only") ||
      exerciseEquipment.includes("dumbbell") ||
      exerciseEquipment.includes("band")
    );
  }

  return true;
}

/**
 * Applies conservative injury-friendly filtering.
 *
 * This is not medical advice. It simply avoids obvious movement patterns that
 * are likely to be unsuitable for the selected protect-area option.
 */
function injurySafe(exercise, injuryFocus) {
  if (injuryFocus === "none") {
    return true;
  }

  const exerciseName = String(exercise.name || "").toLowerCase();
  const movementPattern = exercise.movementPattern || "unknown";

  if (injuryFocus === "shoulder") {
    return movementPattern !== "vertical_push" && !exerciseName.includes("behind the neck");
  }

  if (injuryFocus === "knee") {
    return movementPattern !== "squat" || exerciseName.includes("bodyweight") || exerciseName.includes("box");
  }

  if (injuryFocus === "lower_back") {
    return movementPattern !== "hinge" || exerciseName.includes("dumbbell") || exerciseName.includes("glute");
  }

  return true;
}

/**
 * Creates a tiny deterministic shuffle so Regenerate changes the plan without
 * random loops, recursive calls or expensive sorting.
 */
function deterministicShuffle(exercise, slot, planVersion) {
  const seed = `${exercise.id}-${slot}-${planVersion}`;
  return [...seed].reduce((total, char) => total + char.charCodeAt(0), 0) % 17;
}

/**
 * Scores an exercise for a requested movement slot.
 *
 * Keep this cheap. It is called in a loop across the exercise library.
 */
function scoreExercise(exercise, slot, options) {
  const { equipment, injuryFocus, planVersion, usedExerciseIds } = options;
  let score = 0;

  if (exercise.movementPattern === slot) {
    score += 100;
  }

  if (equipmentMatches(exercise, equipment)) {
    score += 25;
  }

  if (injurySafe(exercise, injuryFocus)) {
    score += 20;
  }

  if (usedExerciseIds.has(exercise.id)) {
    score -= 200;
  }

  if ((exercise.difficulty || "").toLowerCase() === "beginner") {
    score += 3;
  }

  return score + deterministicShuffle(exercise, slot, planVersion);
}

/**
 * Picks the highest-scoring exercise for one slot.
 *
 * This uses a single pass over exerciseLibrary and avoids repeated nested work.
 */
function pickExercise(slot, options) {
  let bestExercise = null;
  let bestScore = -Infinity;

  for (const exercise of exerciseLibrary) {
    const score = scoreExercise(exercise, slot, options);

    if (score > bestScore) {
      bestExercise = exercise;
      bestScore = score;
    }
  }

  return bestExercise || exerciseLibrary[0];
}

/**
 * Builds the public generated exercise shape consumed by AIWorkoutBuilder.jsx.
 */
function buildGeneratedExercise(exercise, prescription) {
  return {
    id: exercise.id,
    name: exercise.name,
    image: exercise.image,
    movementPattern: exercise.movementPattern || "unknown",
    primaryMuscles: exercise.primaryMuscles || [],
    secondaryMuscles: exercise.secondaryMuscles || [],
    equipment: exercise.equipment || [],
    instructions: exercise.instructions || [],
    defaultRestSeconds: exercise.defaultRestSeconds || 90,
    ...prescription,
  };
}

/**
 * Generates an editable training plan from the current exercise library.
 *
 * The output shape is intentionally stable because Workouts.jsx and
 * WorkoutDetail.jsx both rely on the saved plan structure.
 */
export function generateWorkoutPlan({
  goal = "muscle",
  days = "4",
  time = "60",
  level = "intermediate",
  equipment = "full gym",
  injuryFocus = "none",
  planVersion = 1,
} = {}) {
  const safeGoal = splitTemplates[goal] ? goal : "muscle";
  const dayCount = Number(days) || 4;
  const prescription = goalPrescription(safeGoal, level);
  const selectedTemplates = splitTemplates[safeGoal].slice(0, dayCount);
  const usedExerciseIds = new Set();

  return selectedTemplates.map((template, index) => {
    const exercises = template.slots.map((slot) => {
      const selectedExercise = pickExercise(slot, {
        equipment,
        injuryFocus,
        planVersion,
        usedExerciseIds,
      });

      usedExerciseIds.add(selectedExercise.id);

      return buildGeneratedExercise(selectedExercise, prescription);
    });

    return {
      id: `ai-${index + 1}`,
      name: template.name,
      focus: safeGoal,
      time,
      level,
      equipment,
      injuryFocus,
      planVersion,
      exercises,
    };
  });
}

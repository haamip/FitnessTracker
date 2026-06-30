// ============================================================================
// TrackFit Workout Builder Engine
// ----------------------------------------------------------------------------
// Lightweight deterministic generator used by the public Workout Builder.
//
// v0.10.4 change:
// Regenerate now rotates through strong exercise alternatives instead of always
// selecting the single highest-scoring match. This keeps the builder stable,
// fast and predictable while making each regenerate feel genuinely different.
// ============================================================================

export const equipmentLabels = {
  "full gym": "Full Gym",
  dumbbells: "Dumbbells",
  home: "Home / Minimal Kit",
};

const splitTemplates = {
  muscle: [
    { name: "Upper A", slots: ["horizontal_push", "horizontal_pull", "vertical_push", "vertical_pull", "elbow_flexion", "elbow_extension"] },
    { name: "Lower A", slots: ["squat", "hinge", "lunge", "calf_raise", "core"] },
    { name: "Upper B", slots: ["horizontal_push", "horizontal_pull", "vertical_push", "vertical_pull", "elbow_flexion", "elbow_extension"] },
    { name: "Lower B", slots: ["hinge", "squat", "lunge", "core", "conditioning"] },
  ],
  strength: [
    { name: "Heavy Upper", slots: ["horizontal_push", "horizontal_pull", "vertical_push", "vertical_pull"] },
    { name: "Heavy Lower", slots: ["squat", "hinge", "squat", "core"] },
    { name: "Bench Focus", slots: ["horizontal_push", "horizontal_push", "horizontal_pull", "elbow_extension"] },
    { name: "Deadlift Focus", slots: ["hinge", "squat", "horizontal_pull", "core"] },
  ],
  fatloss: [
    { name: "Full Body Strength", slots: ["squat", "horizontal_push", "horizontal_pull", "hinge", "conditioning"] },
    { name: "Conditioning Circuit", slots: ["conditioning", "squat", "horizontal_push", "core"] },
    { name: "Upper Circuit", slots: ["horizontal_push", "horizontal_pull", "vertical_push", "vertical_pull", "core"] },
    { name: "Lower Circuit", slots: ["squat", "hinge", "lunge", "core", "conditioning"] },
  ],
};

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

function normaliseEquipment(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function equipmentMatches(exercise, equipmentMode) {
  if (equipmentMode === "full gym") return true;

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

function injurySafe(exercise, injuryFocus) {
  if (injuryFocus === "none") return true;

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
 * Small deterministic number used to rotate good alternatives.
 *
 * This gives different regenerate versions without using Math.random(), which
 * keeps tests and future debugging predictable.
 */
function deterministicShuffle(exercise, slot, planVersion) {
  const seed = `${exercise.id}-${slot}-${planVersion}`;
  return [...seed].reduce((total, char) => total + char.charCodeAt(0), 0) % 17;
}

function scoreExercise(exercise, slot, options) {
  const { equipment, injuryFocus, planVersion, usedExerciseIds } = options;
  let score = 0;

  if (exercise.movementPattern === slot) score += 100;
  if (equipmentMatches(exercise, equipment)) score += 25;
  if (injurySafe(exercise, injuryFocus)) score += 20;
  if (usedExerciseIds.has(exercise.id)) score -= 200;
  if ((exercise.difficulty || "").toLowerCase() === "beginner") score += 3;

  return score + deterministicShuffle(exercise, slot, planVersion);
}

/**
 * Picks from the strongest matching exercises instead of always taking #1.
 *
 * Previous behaviour:
 *   Regenerate often picked the same exercise because the highest score stayed
 *   highest on every version.
 *
 * New behaviour:
 *   Build a small shortlist of quality matches, then rotate through that
 *   shortlist using planVersion, day index and slot index.
 */
function pickExercise(slot, exerciseLibrary, options) {
  const rankedExercises = exerciseLibrary
    .map((exercise) => ({
      exercise,
      score: scoreExercise(exercise, slot, options),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (rankedExercises.length === 0) {
    return exerciseLibrary[0];
  }

  const bestScore = rankedExercises[0].score;

  const strongMatches = rankedExercises.filter((item) => item.score >= bestScore - 18);
  const shortlist = strongMatches.slice(0, 8);

  const rotationIndex =
    (options.planVersion + options.dayIndex + options.slotIndex) % Math.max(shortlist.length, 1);

  return shortlist[rotationIndex]?.exercise || rankedExercises[0].exercise;
}

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

export function generateWorkoutPlan({
  exerciseLibrary = [],
  goal = "muscle",
  days = "4",
  time = "60",
  level = "intermediate",
  equipment = "full gym",
  injuryFocus = "none",
  planVersion = 1,
} = {}) {
  if (!exerciseLibrary.length) return [];

  const safeGoal = splitTemplates[goal] ? goal : "muscle";
  const dayCount = Number(days) || 4;
  const prescription = goalPrescription(safeGoal, level);
  const selectedTemplates = splitTemplates[safeGoal].slice(0, dayCount);
  const usedExerciseIds = new Set();

  return selectedTemplates.map((template, dayIndex) => {
    const exercises = template.slots.map((slot, slotIndex) => {
      const selectedExercise = pickExercise(slot, exerciseLibrary, {
        equipment,
        injuryFocus,
        planVersion,
        usedExerciseIds,
        dayIndex,
        slotIndex,
      });

      usedExerciseIds.add(selectedExercise.id);

      return buildGeneratedExercise(selectedExercise, prescription);
    });

    return {
      id: `ai-${dayIndex + 1}`,
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
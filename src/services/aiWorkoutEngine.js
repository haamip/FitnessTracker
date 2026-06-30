import { exerciseLibrary } from "../data/exerciseLibrary";

const splitTemplates = {
  muscle: [
    { name: "Upper A", slots: ["horizontal_push", "horizontal_pull", "vertical_push", "vertical_pull", "elbow_flexion", "elbow_extension"] },
    { name: "Lower A", slots: ["squat", "hinge", "squat", "calf_raise", "core"] },
    { name: "Upper B", slots: ["horizontal_push", "horizontal_pull", "vertical_push", "vertical_pull", "elbow_flexion", "elbow_extension"] },
    { name: "Lower B", slots: ["hinge", "squat", "calf_raise", "core", "conditioning"] },
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
    { name: "Lower Circuit", slots: ["squat", "hinge", "calf_raise", "core", "conditioning"] },
  ],
};

export const equipmentLabels = {
  "full gym": "Full Gym",
  dumbbells: "Dumbbells",
  home: "Home / Minimal Kit",
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
    note: "Muscle building range. Chase quality reps.",
  };
}

/**
 * Checks whether an exercise fits the selected equipment mode.
 */
function equipmentMatches(exercise, equipment) {
  if (equipment === "full gym") return true;

  const exerciseEquipment = (exercise.equipment || []).join(" ").toLowerCase();

  if (equipment === "dumbbells") {
    return exerciseEquipment.includes("dumbbell") || exerciseEquipment.includes("body only");
  }

  if (equipment === "home") {
    return exerciseEquipment.includes("body only") || exerciseEquipment.includes("dumbbell");
  }

  return true;
}

/**
 * Keeps generated plans safer when the user selects a protection focus.
 */
function injurySafe(exercise, injuryFocus) {
  if (injuryFocus === "none") return true;

  const name = exercise.name.toLowerCase();
  const pattern = exercise.movementPattern || "";

  if (injuryFocus === "shoulder") {
    return !name.includes("behind the neck") && pattern !== "vertical_push";
  }

  if (injuryFocus === "knee") {
    return pattern !== "squat" || name.includes("bodyweight") || name.includes("box");
  }

  if (injuryFocus === "lower_back") {
    return pattern !== "hinge" || name.includes("dumbbell") || name.includes("glute");
  }

  return true;
}

/**
 * Scores an exercise for one workout slot.
 *
 * This is intentionally lightweight. The previous v0.9 engine likely froze
 * because generation became too heavy during page render.
 */
function scoreExercise(exercise, slot, equipment, usedExerciseIds, injuryFocus, planVersion) {
  let score = 0;

  if (exercise.movementPattern === slot) score += 80;
  if (equipmentMatches(exercise, equipment)) score += 20;
  if (injurySafe(exercise, injuryFocus)) score += 20;

  if (usedExerciseIds.has(exercise.id)) score -= 200;

  if ((exercise.difficulty || "").toLowerCase() === "beginner") score += 2;

  // Small deterministic shuffle so Regenerate changes the plan without randomness loops.
  const seed = `${exercise.id}-${slot}-${planVersion}`;
  const shuffle = [...seed].reduce((total, char) => total + char.charCodeAt(0), 0) % 13;

  return score + shuffle;
}

/**
 * Picks the best exercise for a movement slot.
 */
function pickExercise(slot, equipment, usedExerciseIds, injuryFocus, planVersion) {
  let best = null;
  let bestScore = -Infinity;

  for (const exercise of exerciseLibrary) {
    const score = scoreExercise(exercise, slot, equipment, usedExerciseIds, injuryFocus, planVersion);

    if (score > bestScore) {
      best = exercise;
      bestScore = score;
    }
  }

  return best || exerciseLibrary[0];
}

/**
 * Generates an editable training plan from the exercise library.
 *
 * This keeps generation synchronous, deterministic, and lightweight so the
 * Workout Builder page opens instantly.
 */
export function generateWorkoutPlan({
  goal = "muscle",
  days = "4",
  time = "60",
  level = "intermediate",
  equipment = "full gym",
  injuryFocus = "none",
  planVersion = 1,
}) {
  const safeGoal = splitTemplates[goal] ? goal : "muscle";
  const prescription = goalPrescription(safeGoal, level);
  const selectedTemplates = splitTemplates[safeGoal].slice(0, Number(days));
  const usedExerciseIds = new Set();

  return selectedTemplates.map((template, index) => ({
    id: `ai-${index + 1}`,
    name: template.name,
    focus: safeGoal,
    time,
    level,
    equipment,
    injuryFocus,
    planVersion,
    exercises: template.slots.map((slot) => {
      const selectedExercise = pickExercise(slot, equipment, usedExerciseIds, injuryFocus, planVersion);

      usedExerciseIds.add(selectedExercise.id);

      return {
        id: selectedExercise.id,
        name: selectedExercise.name,
        image: selectedExercise.image,
        movementPattern: selectedExercise.movementPattern,
        primaryMuscles: selectedExercise.primaryMuscles || [],
        equipment: selectedExercise.equipment || [],
        instructions: selectedExercise.instructions || [],
        defaultRestSeconds: selectedExercise.defaultRestSeconds || 90,
        ...prescription,
      };
    }),
  }));
}
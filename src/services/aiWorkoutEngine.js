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

export function goalPrescription(goal, level) {
  if (goal === "strength") {
    return { sets: level === "beginner" ? 3 : 4, reps: "4-6", rest: "120 sec", note: "Heavy work. Longer rests. Add load slowly." };
  }

  if (goal === "fatloss") {
    return { sets: level === "beginner" ? 2 : 3, reps: "10-15", rest: "45-60 sec", note: "Controlled pace. Keep the heart rate up." };
  }

  return { sets: level === "beginner" ? 2 : 3, reps: "8-12", rest: "60-90 sec", note: "Muscle building range. Chase quality reps." };
}

function equipmentMatches(exercise, equipment) {
  if (equipment === "full gym") return true;

  const exerciseEquipment = (exercise.equipment || []).join(" ").toLowerCase();

  if (equipment === "dumbbells") return exerciseEquipment.includes("dumbbell") || exerciseEquipment.includes("body only");
  if (equipment === "home") return exerciseEquipment.includes("body only") || exerciseEquipment.includes("dumbbell");

  return true;
}

function injurySafe(exercise, injuryFocus) {
  if (injuryFocus === "none") return true;

  const name = exercise.name.toLowerCase();
  const pattern = exercise.movementPattern || "";

  if (injuryFocus === "shoulder") return !name.includes("behind the neck") && pattern !== "vertical_push";
  if (injuryFocus === "knee") return pattern !== "squat" || name.includes("bodyweight") || name.includes("box");
  if (injuryFocus === "lower_back") return pattern !== "hinge" || name.includes("dumbbell") || name.includes("glute");

  return true;
}

function scoreExercise(exercise, slot, equipment, usedExerciseIds, injuryFocus) {
  let score = 0;

  if (exercise.movementPattern === slot) score += 60;
  if (equipmentMatches(exercise, equipment)) score += 25;
  if (injurySafe(exercise, injuryFocus)) score += 15;
  if (usedExerciseIds.has(exercise.id)) score -= 100;
  if ((exercise.difficulty || "").toLowerCase() === "beginner") score += 2;

  return score;
}

function pickExercise(slot, equipment, usedExerciseIds, injuryFocus) {
  const rankedExercises = exerciseLibrary
    .map((exercise) => ({ exercise, score: scoreExercise(exercise, slot, equipment, usedExerciseIds, injuryFocus) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.exercise.name.localeCompare(b.exercise.name));

  return rankedExercises[0]?.exercise || exerciseLibrary[0];
}

/**
 * Generates an editable workout program from the exercise library.
 *
 * This is the AI Builder's deterministic engine. Later we can place a real LLM
 * in front of it, but the final program should still be validated through this
 * library-based rules engine so TrackFit never suggests nonsense exercises.
 */
export function generateWorkoutPlan({ goal, days, time, level, equipment, injuryFocus, planVersion }) {
  const prescription = goalPrescription(goal, level);
  const selectedTemplates = splitTemplates[goal].slice(0, Number(days));
  const usedExerciseIds = new Set();

  return selectedTemplates.map((template, index) => ({
    id: `ai-${index + 1}`,
    name: template.name,
    focus: goal,
    time,
    level,
    equipment,
    injuryFocus,
    planVersion,
    exercises: template.slots.map((slot) => {
      const selectedExercise = pickExercise(slot, equipment, usedExerciseIds, injuryFocus);
      usedExerciseIds.add(selectedExercise.id);

      return {
        id: selectedExercise.id,
        name: selectedExercise.name,
        movementPattern: selectedExercise.movementPattern,
        primaryMuscles: selectedExercise.primaryMuscles || [],
        equipment: selectedExercise.equipment || [],
        instructions: selectedExercise.instructions || [],
        ...prescription,
      };
    }),
  }));
}

// Shared quick-start templates. Keep the Train cards and Gym Mode in sync.
export const STARTER_WORKOUTS = [
  { id: "workout-1", name: "Workout 1", detail: "Full body strength session", keys: ["rdl", "calf", "press", "row", "squat"] },
  { id: "upper", name: "Upper Strength", detail: "Chest, back, shoulders and arms", keys: ["press", "row", "floor-press", "curl"] },
  { id: "lower", name: "Lower Strength", detail: "Quads, hamstrings, glutes and core", keys: ["squat", "rdl", "calf"] },
];

const EXERCISES = {
  rdl: { name: "Dumbbell Romanian Deadlift", reps: "10", weight: "35", muscles: ["hamstrings"], equipment: ["dumbbell"], pattern: "hinge", rest: 90 },
  calf: { name: "Dumbbell Standing Calf Raise", reps: "12", weight: "20", muscles: ["calves"], equipment: ["dumbbell"], pattern: "calf_raise", rest: 60 },
  press: { name: "Dumbbell Shoulder Press", reps: "10", weight: "25", muscles: ["shoulders"], equipment: ["dumbbell"], pattern: "vertical_push", rest: 90 },
  row: { name: "Dumbbell Row", reps: "10", weight: "35", muscles: ["lats"], equipment: ["dumbbell"], pattern: "horizontal_pull", rest: 90 },
  squat: { name: "Barbell Back Squat", reps: "10", weight: "80", muscles: ["quadriceps"], equipment: ["barbell"], pattern: "squat", rest: 120 },
  "floor-press": { name: "Dumbbell Floor Press", reps: "10", weight: "", muscles: ["chest"], equipment: ["dumbbell"], pattern: "horizontal_push", rest: 90 },
  curl: { name: "Dumbbell Bicep Curl", reps: "12", weight: "", muscles: ["biceps"], equipment: ["dumbbell"], pattern: "elbow_flexion", rest: 60 },
};

export function createStarterWorkoutExercises(workoutId) {
  const starter = STARTER_WORKOUTS.find((item) => item.id === workoutId);
  if (!starter) return [];

  return starter.keys.map((key) => {
    const spec = EXERCISES[key];
    return {
      id: `${key}-${crypto.randomUUID()}`,
      libraryId: key,
      name: spec.name,
      target: `2 sets - ${spec.reps} reps`,
      primaryMuscles: spec.muscles,
      equipment: spec.equipment,
      movementPattern: spec.pattern,
      defaultRestSeconds: spec.rest,
      sets: Array.from({ length: 2 }, () => ({
        id: crypto.randomUUID(),
        weight: spec.weight,
        reps: spec.reps,
        type: "S",
        done: false,
        rpe: "",
        rir: "",
        failure: false,
        note: "",
      })),
    };
  });
}

// AI plan days store sets as a count, whereas editable templates store sets as rows.
export function createPlanDayExercises(day) {
  return (day?.exercises || []).map((exercise) => {
    const count = Math.max(1, Math.min(30, Number(exercise.sets) || 3));
    const reps = String(exercise.reps || "8-12");
    return {
      id: `${exercise.id || "exercise"}-${crypto.randomUUID()}`,
      libraryId: exercise.id,
      name: exercise.name,
      image: exercise.image || "",
      primaryMuscles: exercise.primaryMuscles || [],
      equipment: exercise.equipment || [],
      movementPattern: exercise.movementPattern || "unknown",
      defaultRestSeconds: Number.parseInt(exercise.rest, 10) || 90,
      instructions: exercise.instructions || [],
      target: `${count} sets - ${reps} reps`,
      sets: Array.from({ length: count }, () => ({
        id: crypto.randomUUID(),
        weight: "",
        reps,
        type: "S",
        done: false,
        rpe: "",
        rir: "",
        failure: false,
        note: "",
      })),
    };
  });
}

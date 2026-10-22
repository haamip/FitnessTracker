import { describe, expect, it } from "vitest";
import {
  STARTER_WORKOUTS,
  createPlanDayExercises,
  createStarterWorkoutExercises,
} from "./starterWorkouts";

describe("shared workout card templates", () => {
  it("provides distinct, editable quick-start exercises for every visible preset", () => {
    expect(STARTER_WORKOUTS).toHaveLength(3);
    const [full, upper, lower] = STARTER_WORKOUTS.map(({ id }) => createStarterWorkoutExercises(id));
    expect(full).toHaveLength(5);
    expect(upper.map((exercise) => exercise.name)).toContain("Dumbbell Bicep Curl");
    expect(lower.map((exercise) => exercise.name)).toContain("Barbell Back Squat");
    expect(lower).not.toEqual(upper);
    expect(full.every((exercise) => Array.isArray(exercise.sets) && exercise.sets.length === 2)).toBe(true);
  });

  it("returns fresh mutable copies without sharing exercise or set identifiers", () => {
    const first = createStarterWorkoutExercises("upper");
    const second = createStarterWorkoutExercises("upper");
    expect(first[0].id).not.toBe(second[0].id);
    expect(first[0].sets[0].id).not.toBe(second[0].sets[0].id);
    first[0].sets[0].done = true;
    expect(second[0].sets[0].done).toBe(false);
  });

  it("converts an AI training day into full editable set rows", () => {
    const result = createPlanDayExercises({
      exercises: [{ id: "bench", name: "Bench Press", sets: 3, reps: "6-8", rest: "120 sec" }],
    });
    expect(result).toHaveLength(1);
    expect(result[0].sets).toHaveLength(3);
    expect(result[0].sets[0]).toMatchObject({ reps: "6-8", done: false });
    expect(result[0].target).toBe("3 sets - 6-8 reps");
  });

  it("does not turn unknown workouts into made-up templates", () => {
    expect(createStarterWorkoutExercises("not-a-workout")).toEqual([]);
  });
});

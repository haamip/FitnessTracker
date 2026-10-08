import { describe, expect, it } from "vitest";
import { isUsableWorkoutExercise } from "./workoutImportValidation";

describe("workout import validation", () => {
  it("accepts a normal pasted exercise", () => {
    expect(isUsableWorkoutExercise({ name: "Bench Press", sets: "4", reps: "6-8" })).toBe(true);
  });

  it("rejects blank names or missing rep targets", () => {
    expect(isUsableWorkoutExercise({ name: "", sets: 3, reps: 10 })).toBe(false);
    expect(isUsableWorkoutExercise({ name: "Squat", sets: 3, reps: "" })).toBe(false);
  });

  it("rejects zero, invalid, negative, non-integer and excessive sets", () => {
    for (const sets of ["0", "-2", "abc", "2.5", "99999999"]) {
      expect(isUsableWorkoutExercise({ name: "Squat", sets, reps: "8" })).toBe(false);
    }
  });
});

import { describe, expect, it, vi } from "vitest";
vi.mock("./supabase", () => ({ supabase: null }));
import { normaliseImportedExercise, parseWorkoutWithAI } from "./aiWorkoutImporter";

describe("AI workout importer contract", () => {
  it("preserves ranges and review flags in imported data", () => {
    const exercise = normaliseImportedExercise({
      name: "Dumbbell bench press", sets: 4, repsMin: "6", repsMax: "8",
      note: "90 sec rest", confidence: "high", equipment: "dumbbell",
    }, 0);
    expect(exercise).toMatchObject({ name: "Dumbbell bench press", sets: "4", reps: "6-8", needsReview: false });
    expect(exercise.note).toBe("90 sec rest");
  });
  it("does not invent unprovided sets or reps", () => {
    const ex = normaliseImportedExercise({ name: "Cable row", sets: 0, repsMin: "", repsMax: "", confidence: "low" }, 1);
    expect(ex.sets).toBe("");
    expect(ex.reps).toBe("");
    expect(ex.needsReview).toBe(true);
  });
  it("rejects invalid oversized prescriptions", () => {
    const ex = normaliseImportedExercise({ name: "Squat", sets: 100, repsMin: "10", confidence: "medium" }, 2);
    expect(ex.sets).toBe("");
    expect(ex.needsReview).toBe(true);
  });
  it("never claims the AI ran when the account is disconnected", async () => {
    await expect(parseWorkoutWithAI({ text: "Bench 4x8" })).rejects.toThrow(/account connection/);
  });
});

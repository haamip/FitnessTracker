import { describe, expect, it } from "vitest";
import { parseWorkoutText } from "./workoutTextParser";

describe("parseWorkoutText", () => {
  it("parses common workout formats", () => {
    const result = parseWorkoutText(`
      PUSH DAY
      Bench Press - 4 x 8
      Incline Dumbbell Press: 3 sets of 10
      Cable Fly | 3 | 12-15
      Push Ups 2 x AMRAP
    `);

    expect(result.exercises).toHaveLength(4);
    expect(result.exercises[0]).toMatchObject({
      name: "Bench Press",
      sets: "4",
      reps: "8",
      needsReview: false,
    });
    expect(result.exercises[1]).toMatchObject({ sets: "3", reps: "10" });
    expect(result.exercises[2]).toMatchObject({ sets: "3", reps: "12-15" });
    expect(result.exercises[3]).toMatchObject({ sets: "2", reps: "AMRAP" });
  });

  it("keeps uncertain prescriptions blank instead of inventing values", () => {
    const result = parseWorkoutText("Romanian Deadlift\nLeg Extension - 12 reps");

    expect(result.exercises[0]).toMatchObject({
      name: "Romanian Deadlift",
      sets: "",
      reps: "",
      needsReview: true,
    });
    expect(result.exercises[1]).toMatchObject({
      name: "Leg Extension",
      sets: "",
      reps: "12",
      needsReview: true,
    });
    expect(result.reviewCount).toBe(2);
  });

  it("preserves useful prescription notes", () => {
    const result = parseWorkoutText("Back Squat - 5 x 5 @ 80kg, rest 3 min");

    expect(result.exercises[0]).toMatchObject({
      name: "Back Squat",
      sets: "5",
      reps: "5",
      note: "@ 80kg, rest 3 min",
    });
  });

  it("ignores headings and table headers", () => {
    const result = parseWorkoutText("Exercise | Sets | Reps\nLOWER BODY\nHack Squat | 4 | 10");

    expect(result.exercises).toHaveLength(1);
    expect(result.ignoredLines).toEqual(["Exercise | Sets | Reps", "LOWER BODY"]);
  });
});

import { describe, expect, it } from "vitest";
import { getExerciseRecommendation } from "../progressionEngine";

const exercise = {
  id: "bench-press-runtime",
  libraryId: "bench-press",
  name: "Bench Press",
  sets: [
    { weight: "80", reps: "8", done: false },
    { weight: "80", reps: "8", done: false },
  ],
};

const history = [
  {
    completedAt: new Date().toISOString(),
    exercises: [
      {
        id: "bench-press-old",
        libraryId: "bench-press",
        name: "Bench Press",
        sets: [
          { weight: "80", reps: "8", done: true },
          { weight: "80", reps: "8", done: true },
        ],
      },
    ],
  },
];

describe("progressionEngine", () => {
  it("adds a small load jump when all previous sets were completed", () => {
    const recommendation = getExerciseRecommendation(exercise, history);

    expect(recommendation.targets[0].weight).toBe("82.5");
    expect(recommendation.reason).toContain("progressive overload");
  });

  it("falls back to current targets when no previous data exists", () => {
    const recommendation = getExerciseRecommendation(exercise, []);

    expect(recommendation.targets[0].weight).toBe("80");
  });
});

import { describe, expect, it } from "vitest";
import { detectWorkoutPRs, estimateOneRepMax } from "../prEngine";

const oldHistory = [
  {
    completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    exercises: [
      {
        id: "bench-press",
        libraryId: "bench-press",
        name: "Bench Press",
        sets: [{ weight: "80", reps: "8", done: true }],
      },
    ],
  },
];

describe("prEngine", () => {
  it("calculates estimated one-rep max using the Epley formula", () => {
    expect(estimateOneRepMax("100", "10")).toBe(133.3);
  });

  it("detects new PRs compared with previous workout history", () => {
    const prs = detectWorkoutPRs(oldHistory, [
      {
        id: "bench-press",
        libraryId: "bench-press",
        name: "Bench Press",
        sets: [{ weight: "85", reps: "8", done: true }],
      },
    ]);

    expect(prs.some((pr) => pr.type === "Heaviest Set")).toBe(true);
  });
});

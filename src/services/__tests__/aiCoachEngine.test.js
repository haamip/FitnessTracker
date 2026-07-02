import { describe, expect, it } from "vitest";
import {
  calculateTrainingReadiness,
  detectPlateaus,
  generateDailyCoachBrief,
} from "../engines/aiCoachEngine";

function workout(
  daysAgo,
  exerciseName = "Bench Press",
  weight = "80",
  reps = "8",
) {
  return {
    title: "Upper A",
    workoutId: "upper-a",
    completedAt: new Date(
      Date.now() - daysAgo * 24 * 60 * 60 * 1000,
    ).toISOString(),
    durationSeconds: 3600,
    completedSets: 3,
    totalSets: 3,
    volume: Number(weight) * Number(reps) * 3,
    prs: [],
    exercises: [
      {
        id: "bench-press",
        libraryId: "bench-press",
        name: exerciseName,
        primaryMuscles: ["chest"],
        sets: [
          { weight, reps, done: true },
          { weight, reps, done: true },
          { weight, reps, done: true },
        ],
      },
    ],
  };
}

describe("aiCoachEngine", () => {
  it("creates a useful baseline coach brief without history", () => {
    const coach = generateDailyCoachBrief([]);

    expect(coach.suggestedWorkout.title).toBe("Start Workout 1");
    expect(coach.readiness.score).toBeGreaterThan(0);
    expect(coach.reasons.length).toBeGreaterThan(1);
  });

  it("estimates training readiness from completed workout history", () => {
    const readiness = calculateTrainingReadiness([workout(3)]);

    expect(readiness.score).toBeGreaterThan(0);
    expect(readiness.muscles[0].muscle).toBe("chest");
  });

  it("detects a simple plateau when recent best scores are flat", () => {
    const plateaus = detectPlateaus([workout(1), workout(4), workout(8)]);

    expect(plateaus[0].exercise).toBe("Bench Press");
  });
});

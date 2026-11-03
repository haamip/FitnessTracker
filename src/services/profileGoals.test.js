import { describe, expect, it } from "vitest";
import { buildProfilePayload, calculateWeightGoalProgress, normalizeProfile } from "./profileGoals";

const good = {
  display_name: "Tester",
  timezone: "Pacific/Auckland",
  calorie_target: 2500,
  protein_target: 180,
  water_target_l: 3,
  fitness_goal: "lose_fat",
  starting_weight_kg: "100",
  goal_weight_kg: "95",
  workouts_per_week: "4",
  shift_pattern: "rotating",
};

describe("private member fitness goals", () => {
  it("saves an explicit training goal and optional starting/target weights", () => {
    const payload = buildProfilePayload("user-id", good);
    expect(payload).toMatchObject({
      id: "user-id",
      display_name: "Tester",
      fitness_goal: "lose_fat",
      starting_weight_kg: 100,
      goal_weight_kg: 95,
      workouts_per_week: 4,
      shift_pattern: "rotating",
      onboarding_complete: true,
    });
  });

  it("allows users to train without entering a weight goal", () => {
    const payload = buildProfilePayload("user-id", { ...good, starting_weight_kg: "", goal_weight_kg: "" });
    expect(payload.starting_weight_kg).toBeNull();
    expect(payload.goal_weight_kg).toBeNull();
    expect(calculateWeightGoalProgress(null, null, null)).toBeNull();
  });

  it("rejects implausible or malformed target values", () => {
    expect(() => buildProfilePayload("user-id", { ...good, workouts_per_week: 8 })).toThrow();
    expect(() => buildProfilePayload("user-id", { ...good, goal_weight_kg: 0 })).toThrow();
    expect(() => buildProfilePayload("user-id", { ...good, fitness_goal: "unsafe" })).toThrow();
  });

  it("measures progress only against a real logged weight", () => {
    expect(calculateWeightGoalProgress(100, 97, 95)).toMatchObject({ progressPercent: 60, remainingKg: 2 });
    expect(calculateWeightGoalProgress(75, 78, 80)).toMatchObject({ progressPercent: 60, remainingKg: 2 });
    expect(calculateWeightGoalProgress(100, null, 95)).toBeNull();
    expect(calculateWeightGoalProgress(95, 95, 95)).toBeNull();
  });

  it("preserves blank optional weights when loading a profile", () => {
    expect(normalizeProfile({ starting_weight_kg: null, goal_weight_kg: null }))
      .toMatchObject({ starting_weight_kg: "", goal_weight_kg: "" });
  });
});

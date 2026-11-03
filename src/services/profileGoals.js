export const FITNESS_GOALS = [
  { value: "lose_fat", label: "Lose body fat" },
  { value: "build_muscle", label: "Build muscle & strength" },
  { value: "general_fitness", label: "Improve overall fitness" },
  { value: "maintain", label: "Maintain my progress" },
  { value: "performance", label: "Improve performance" },
];

export const SHIFT_PATTERNS = [
  { value: "standard", label: "Regular routine" },
  { value: "days", label: "Day shift" },
  { value: "nights", label: "Night shift" },
  { value: "rotating", label: "Rotating / FIFO roster" },
];

export const PROFILE_FIELDS = [
  "display_name", "timezone", "calorie_target", "protein_target", "water_target_l",
  "fitness_goal", "starting_weight_kg", "goal_weight_kg", "workouts_per_week", "shift_pattern",
];

export const getDefaultProfile = () => ({
  display_name: "",
  timezone: "Australia/Perth",
  calorie_target: 2500,
  protein_target: 185,
  water_target_l: 3,
  fitness_goal: "general_fitness",
  starting_weight_kg: "",
  goal_weight_kg: "",
  workouts_per_week: 3,
  shift_pattern: "standard",
});

export function normalizeProfile(row = {}) {
  return {
    ...getDefaultProfile(),
    ...Object.fromEntries(PROFILE_FIELDS.filter((key) => row?.[key] !== undefined).map((key) => [key, row[key]])),
    starting_weight_kg: row?.starting_weight_kg ?? "",
    goal_weight_kg: row?.goal_weight_kg ?? "",
  };
}

function requiredNumber(raw, min, max, label, whole = false) {
  if (raw === "" || raw === null || raw === undefined) throw new Error(label + " is required.");
  const number = Number(raw);
  if (!Number.isFinite(number) || number < min || number > max || (whole && !Number.isInteger(number))) {
    throw new Error(label + " must be between " + min + " and " + max + ".");
  }
  return number;
}

function optionalWeight(raw, label) {
  if (raw === "" || raw === null || raw === undefined) return null;
  return requiredNumber(raw, 20, 400, label);
}

export function buildProfilePayload(userId, form) {
  if (!userId) throw new Error("Sign in to save your profile.");
  const name = String(form.display_name || "").trim();
  if (!name || name.length > 80) throw new Error("Enter a name (up to 80 characters).");
  const fitnessGoal = String(form.fitness_goal || "");
  if (!FITNESS_GOALS.some((item) => item.value === fitnessGoal)) throw new Error("Choose a fitness goal.");
  const shiftPattern = String(form.shift_pattern || "");
  if (!SHIFT_PATTERNS.some((item) => item.value === shiftPattern)) throw new Error("Choose a work routine.");

  return {
    id: userId,
    display_name: name,
    timezone: String(form.timezone || "Australia/Perth"),
    calorie_target: requiredNumber(form.calorie_target, 1000, 6000, "Daily calories", true),
    protein_target: requiredNumber(form.protein_target, 0, 400, "Daily protein", true),
    water_target_l: requiredNumber(form.water_target_l, 0.5, 12, "Daily water"),
    fitness_goal: fitnessGoal,
    starting_weight_kg: optionalWeight(form.starting_weight_kg, "Starting weight"),
    goal_weight_kg: optionalWeight(form.goal_weight_kg, "Goal weight"),
    workouts_per_week: requiredNumber(form.workouts_per_week, 1, 7, "Weekly training sessions", true),
    shift_pattern: shiftPattern,
    onboarding_complete: true,
    updated_at: new Date().toISOString(),
  };
}

export function calculateWeightGoalProgress(starting, current, target) {
  const start = Number(starting);
  const now = Number(current);
  const end = Number(target);
  if ([starting, current, target].some((x) => x === "" || x === null || x === undefined) ||
    ![start, now, end].every(Number.isFinite) || Math.abs(end - start) < 0.01) return null;
  const progressPercent = Math.max(0, Math.min(100, Math.round(((now - start) / (end - start)) * 100)));
  return {
    progressPercent,
    changeKg: Number((now - start).toFixed(1)),
    remainingKg: Number(Math.abs(end - now).toFixed(1)),
    direction: end < start ? "loss" : "gain",
  };
}

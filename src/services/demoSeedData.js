import {
  AIPlanRepository,
  CardioRepository,
  CheckInRepository,
  HistoryRepository,
  WorkoutRepository,
} from "./trackfitDataLayer";

/**
 * ============================================================================
 * TrackFit demo seed data
 * ============================================================================
 *
 * PURPOSE
 * -------
 * Creates realistic local demo records so development and phone testing feel
 * populated immediately.
 *
 * Difficulty
 * ----------
 * ⭐⭐☆☆☆
 *
 * Why this exists
 * ---------------
 * Coach engines need previous workouts to analyse. Empty history makes the UI
 * look tidy, but it gives the intelligence layer nothing to learn from.
 *
 * Developer note
 * --------------
 * This file must use repositories only. Do not write to localStorage here.
 *
 * ============================================================================
 */

const MUSCLES_BY_PATTERN = {
  horizontal_push: ["chest", "shoulders", "triceps"],
  vertical_push: ["shoulders", "triceps"],
  horizontal_pull: ["middle_back", "lats", "biceps"],
  rear_delt: ["shoulders", "middle_back"],
  elbow_flexion: ["biceps"],
  squat: ["quadriceps", "glutes", "hamstrings"],
  hinge: ["glutes", "hamstrings", "lower_back"],
  carry: ["middle_back", "lower_back"],
};

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function createSet(id, weight, reps, done = true) {
  return {
    id,
    weight: String(weight),
    reps: String(reps),
    type: "S",
    done,
    rpe: "",
    rir: "",
    failure: false,
    note: "",
  };
}

function createExercise(id, name, libraryId, movementPattern, weight, reps, setCount) {
  const primaryMuscles = MUSCLES_BY_PATTERN[movementPattern] || [];

  return {
    id,
    libraryId,
    name,
    target: `${setCount} sets - ${reps} reps`,
    image: "/exercise-images/trackfit-fallback.svg",
    primaryMuscles,
    equipment: ["gym"],
    movementPattern,
    defaultRestSeconds: 90,
    exerciseNote: "",
    sets: Array.from({ length: setCount }, (_, index) =>
      createSet(`${id}-set-${index + 1}`, weight, reps),
    ),
  };
}

function createWorkout(id, daysBack, title, exercises, prs = []) {
  const completedSets = exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.done).length, 0);
  const totalSets = exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
  const volume = exercises.reduce(
    (workoutTotal, exercise) =>
      workoutTotal +
      exercise.sets.reduce((setTotal, set) => {
        if (!set.done) return setTotal;
        return setTotal + Number(set.weight || 0) * Number(set.reps || 0);
      }, 0),
    0,
  );

  return {
    id,
    workoutId: id.replace("demo-history-", "demo-plan-"),
    title,
    completedAt: daysAgo(daysBack),
    seconds: 2850 + daysBack * 75,
    durationSeconds: 2850 + daysBack * 75,
    completedSets,
    totalSets,
    volume,
    prs,
    exercises,
    notes: "Demo session generated for TrackFit testing.",
  };
}

function createPlanExercise(id, name, movementPattern, sets, reps, rest = "90 sec", demoWeight = "") {
  return {
    id,
    name,
    sets,
    reps,
    rest,
    image: "/exercise-images/trackfit-fallback.svg",
    primaryMuscles: MUSCLES_BY_PATTERN[movementPattern] || [],
    equipment: ["gym"],
    movementPattern,
    instructions: [],
    demoWeight,
  };
}

function createWorkoutFromPlanDay(day) {
  return day.exercises.map((exercise) => ({
    id: `${exercise.id}-demo-workout`,
    libraryId: exercise.id,
    name: exercise.name,
    target: `${exercise.sets} sets - ${exercise.reps} reps`,
    image: exercise.image,
    primaryMuscles: exercise.primaryMuscles,
    equipment: exercise.equipment,
    movementPattern: exercise.movementPattern,
    instructions: exercise.instructions,
    defaultRestSeconds: Number.parseInt(exercise.rest, 10) || 90,
    exerciseNote: "",
    sets: Array.from({ length: exercise.sets }, (_, index) => ({
      id: `${exercise.id}-planned-set-${index + 1}`,
      weight: exercise.demoWeight || "",
      reps: exercise.reps,
      type: "S",
      done: false,
      rpe: "",
      rir: "",
      failure: false,
      note: "",
    })),
  }));
}

function createDemoPlan() {
  return [
    {
      id: "demo-plan-upper-strength",
      name: "Upper Strength",
      focus: "Chest, back and shoulders",
      equipment: "Full gym",
      time: 60,
      exercises: [
        createPlanExercise("barbell-bench-press-medium-grip", "Barbell Bench Press", "horizontal_push", 4, "6", "120 sec", "82.5"),
        createPlanExercise("barbell-rear-delt-row", "Barbell Rear Delt Row", "horizontal_pull", 3, "8", "90 sec", "55"),
        createPlanExercise("barbell-shoulder-pres", "Barbell Shoulder Press", "vertical_push", 3, "8", "90 sec", "45"),
        createPlanExercise("barbell-curl", "Barbell Curl", "elbow_flexion", 3, "10", "60 sec", "35"),
      ],
    },
    {
      id: "demo-plan-lower-strength",
      name: "Lower Strength",
      focus: "Quads, glutes and hamstrings",
      equipment: "Full gym",
      time: 60,
      exercises: [
        createPlanExercise("barbell-lunge", "Barbell Lunge", "squat", 4, "8", "120 sec", "55"),
        createPlanExercise("barbell-glute-bridge", "Barbell Glute Bridge", "hinge", 4, "8", "120 sec", "105"),
        createPlanExercise("barbell-shrug", "Barbell Shrug", "carry", 3, "10", "90 sec", "90"),
      ],
    },
    {
      id: "demo-plan-push-volume",
      name: "Push Volume",
      focus: "Chest, shoulders and triceps",
      equipment: "Full gym",
      time: 50,
      exercises: [
        createPlanExercise("barbell-incline-bench-press-medium-grip", "Incline Bench Press", "horizontal_push", 3, "10", "90 sec", "65"),
        createPlanExercise("barbell-guillotine-bench-press", "Guillotine Bench Press", "horizontal_push", 3, "10", "90 sec", "52.5"),
        createPlanExercise("barbell-shoulder-pres", "Barbell Shoulder Press", "vertical_push", 3, "8", "90 sec", "45"),
      ],
    },
    {
      id: "demo-plan-pull-volume",
      name: "Pull Volume",
      focus: "Back, rear delts and arms",
      equipment: "Full gym",
      time: 50,
      exercises: [
        createPlanExercise("barbell-rear-delt-row", "Barbell Rear Delt Row", "horizontal_pull", 4, "10", "90 sec", "55"),
        createPlanExercise("back-flyes-with-bands", "Back Flyes With Bands", "rear_delt", 3, "12", "60 sec", "12.5"),
        createPlanExercise("barbell-curl", "Barbell Curl", "elbow_flexion", 3, "10", "60 sec", "35"),
      ],
    },
  ];
}

function createDemoWorkoutHistory() {
  return [
    createWorkout("demo-history-upper-1", 0, "Upper Strength", [
      createExercise("demo-bench-1", "Barbell Bench Press", "barbell-bench-press-medium-grip", "horizontal_push", 82.5, 6, 4),
      createExercise("demo-row-1", "Barbell Rear Delt Row", "barbell-rear-delt-row", "horizontal_pull", 55, 10, 3),
      createExercise("demo-press-1", "Barbell Shoulder Press", "barbell-shoulder-pres", "vertical_push", 45, 8, 3),
    ], [{ type: "Estimated 1RM", exercise: "Barbell Bench Press", value: "99kg" }]),
    createWorkout("demo-history-lower-1", 2, "Lower Strength", [
      createExercise("demo-lunge-1", "Barbell Lunge", "barbell-lunge", "squat", 55, 8, 4),
      createExercise("demo-bridge-1", "Barbell Glute Bridge", "barbell-glute-bridge", "hinge", 105, 10, 4),
      createExercise("demo-shrug-1", "Barbell Shrug", "barbell-shrug", "carry", 90, 12, 3),
    ]),
    createWorkout("demo-history-push-1", 4, "Push Volume", [
      createExercise("demo-incline-1", "Incline Bench Press", "barbell-incline-bench-press-medium-grip", "horizontal_push", 62.5, 10, 3),
      createExercise("demo-guillotine-1", "Guillotine Bench Press", "barbell-guillotine-bench-press", "horizontal_push", 50, 12, 3),
      createExercise("demo-press-2", "Barbell Shoulder Press", "barbell-shoulder-pres", "vertical_push", 42.5, 9, 3),
    ], [{ type: "Set Volume", exercise: "Incline Bench Press", value: "625kg" }]),
    createWorkout("demo-history-pull-1", 6, "Pull Volume", [
      createExercise("demo-row-2", "Barbell Rear Delt Row", "barbell-rear-delt-row", "horizontal_pull", 52.5, 12, 4),
      createExercise("demo-band-fly-1", "Back Flyes With Bands", "back-flyes-with-bands", "rear_delt", 12.5, 15, 3),
      createExercise("demo-curl-1", "Barbell Curl", "barbell-curl", "elbow_flexion", 35, 10, 3),
    ]),
    createWorkout("demo-history-upper-2", 9, "Upper Strength", [
      createExercise("demo-bench-2", "Barbell Bench Press", "barbell-bench-press-medium-grip", "horizontal_push", 80, 6, 4),
      createExercise("demo-row-3", "Barbell Rear Delt Row", "barbell-rear-delt-row", "horizontal_pull", 52.5, 10, 3),
      createExercise("demo-press-3", "Barbell Shoulder Press", "barbell-shoulder-pres", "vertical_push", 42.5, 8, 3),
    ]),
    createWorkout("demo-history-lower-2", 12, "Lower Strength", [
      createExercise("demo-lunge-2", "Barbell Lunge", "barbell-lunge", "squat", 52.5, 8, 4),
      createExercise("demo-bridge-2", "Barbell Glute Bridge", "barbell-glute-bridge", "hinge", 100, 10, 4),
      createExercise("demo-shrug-2", "Barbell Shrug", "barbell-shrug", "carry", 87.5, 12, 3),
    ]),
    createWorkout("demo-history-push-2", 15, "Push Volume", [
      createExercise("demo-incline-2", "Incline Bench Press", "barbell-incline-bench-press-medium-grip", "horizontal_push", 60, 10, 3),
      createExercise("demo-guillotine-2", "Guillotine Bench Press", "barbell-guillotine-bench-press", "horizontal_push", 50, 10, 3),
      createExercise("demo-press-4", "Barbell Shoulder Press", "barbell-shoulder-pres", "vertical_push", 40, 9, 3),
    ]),
    createWorkout("demo-history-pull-2", 18, "Pull Volume", [
      createExercise("demo-row-4", "Barbell Rear Delt Row", "barbell-rear-delt-row", "horizontal_pull", 50, 12, 4),
      createExercise("demo-band-fly-2", "Back Flyes With Bands", "back-flyes-with-bands", "rear_delt", 12.5, 12, 3),
      createExercise("demo-curl-2", "Barbell Curl", "barbell-curl", "elbow_flexion", 32.5, 10, 3),
    ]),
    createWorkout("demo-history-upper-3", 22, "Upper Strength", [
      createExercise("demo-bench-3", "Barbell Bench Press", "barbell-bench-press-medium-grip", "horizontal_push", 80, 6, 4),
      createExercise("demo-row-5", "Barbell Rear Delt Row", "barbell-rear-delt-row", "horizontal_pull", 50, 10, 3),
      createExercise("demo-press-5", "Barbell Shoulder Press", "barbell-shoulder-pres", "vertical_push", 40, 8, 3),
    ]),
    createWorkout("demo-history-lower-3", 25, "Lower Strength", [
      createExercise("demo-lunge-3", "Barbell Lunge", "barbell-lunge", "squat", 50, 8, 4),
      createExercise("demo-bridge-3", "Barbell Glute Bridge", "barbell-glute-bridge", "hinge", 95, 10, 4),
      createExercise("demo-shrug-3", "Barbell Shrug", "barbell-shrug", "carry", 85, 12, 3),
    ]),
    createWorkout("demo-history-push-3", 28, "Push Volume", [
      createExercise("demo-incline-3", "Incline Bench Press", "barbell-incline-bench-press-medium-grip", "horizontal_push", 57.5, 10, 3),
      createExercise("demo-guillotine-3", "Guillotine Bench Press", "barbell-guillotine-bench-press", "horizontal_push", 47.5, 10, 3),
      createExercise("demo-press-6", "Barbell Shoulder Press", "barbell-shoulder-pres", "vertical_push", 40, 8, 3),
    ]),
  ];
}

function saveDemoPlanWorkouts(plan) {
  plan.forEach((day) => {
    WorkoutRepository.saveById(day.id, createWorkoutFromPlanDay(day));
  });
}

function clearDemoPlanWorkouts(plan) {
  plan.forEach((day) => {
    WorkoutRepository.removeById(day.id);
  });
}

export function seedDemoData() {
  const plan = createDemoPlan();
  const workouts = createDemoWorkoutHistory();

  const checkins = Array.from({ length: 28 }, (_, index) => ({
    id: `demo-checkin-${index}`,
    date: daysAgo(index),
    protein: 170 + (index % 6) * 5,
    water: Math.round((3 + (index % 5) * 0.2) * 10) / 10,
    sleep: Math.round((6.1 + (index % 6) * 0.25) * 10) / 10,
    trained: [0, 2, 4, 6, 9, 12, 15, 18, 22, 25].includes(index),
    weight: Math.round((104.8 - index * 0.06) * 10) / 10,
  }));

  const cardio = [
    { id: "demo-cardio-1", date: daysAgo(0), type: "Incline Walk", distance: 3.4, duration: 28 },
    { id: "demo-cardio-2", date: daysAgo(2), type: "Bike", distance: 8.8, duration: 24 },
    { id: "demo-cardio-3", date: daysAgo(4), type: "Walk", distance: 4.2, duration: 39 },
    { id: "demo-cardio-4", date: daysAgo(7), type: "Incline Walk", distance: 3.1, duration: 26 },
    { id: "demo-cardio-5", date: daysAgo(10), type: "Rower", distance: 2.2, duration: 12 },
    { id: "demo-cardio-6", date: daysAgo(14), type: "Incline Walk", distance: 3.8, duration: 32 },
    { id: "demo-cardio-7", date: daysAgo(21), type: "Walk", distance: 4.6, duration: 42 },
  ];

  clearDemoData();
  AIPlanRepository.savePlan(plan);
  HistoryRepository.saveAll(workouts);
  CheckInRepository.saveAll(checkins);
  CardioRepository.saveAll(cardio);
  saveDemoPlanWorkouts(plan);

  return workouts;
}

export function clearDemoData() {
  clearDemoPlanWorkouts(AIPlanRepository.getPlan());
  AIPlanRepository.clear();
  HistoryRepository.clear();
  CheckInRepository.clear();
  CardioRepository.clear();
}

/**
 * ============================================================================
 * DEVELOPER NOTES
 * ============================================================================
 *
 * The history now covers roughly four weeks.
 *
 * This gives future engines enough data for:
 *
 * - weekly summary
 * - recovery estimates
 * - fatigue detection
 * - plateau detection
 * - PR detection
 * - training trend cards
 *
 * If Coach output looks wrong, check this order:
 *
 * 1. Developer Tools seed button
 * 2. History repository JSON
 * 3. Coach engine calculation
 * 4. Coach UI card
 *
 * Follow the data. Do not guess.
 *
 * ============================================================================
 */

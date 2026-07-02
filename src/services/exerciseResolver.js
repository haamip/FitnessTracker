// ============================================================================
// TrackFit Exercise Resolver
// ----------------------------------------------------------------------------
// Normalises raw exercise records into stable movement families. The resolver is
// the shared intelligence layer used by images, progress, PR tracking, workout
// building and future nutrition/recovery logic.
// ============================================================================

import { exerciseLibrary } from "../data/exerciseLibrary";
import { exerciseImageMap } from "../data/exerciseImageMap";

const FALLBACK_EXERCISE_IMAGE = "/exercise-images/trackfit-fallback.svg";

/**
 * Canonical exercise families.
 *
 * These entries intentionally group close variations together. For example,
 * a paused bench press, board press and close-grip bench press can all use the
 * same fallback family image and progress bucket until TrackFit adds a more
 * detailed variation-specific model later.
 */
const CANONICAL_EXERCISES = [
  {
    id: "bench_press",
    displayName: "Bench Press",
    imageKey: "bench-press",
    movementPattern: "horizontal_push",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["triceps", "shoulders"],
    equipment: ["barbell", "dumbbell", "machine", "smith"],
    aliases: [
      "bench press",
      "barbell bench press",
      "board press",
      "chest press",
      "close grip bench press",
      "wide grip bench press",
      "floor press",
    ],
  },
  {
    id: "incline_press",
    displayName: "Incline Press",
    imageKey: "incline-bench-press",
    movementPattern: "incline_push",
    primaryMuscles: ["upper chest"],
    secondaryMuscles: ["front delts", "triceps"],
    equipment: ["barbell", "dumbbell", "machine", "smith"],
    aliases: [
      "incline bench press",
      "incline dumbbell bench press",
      "incline chest press",
      "incline press",
    ],
  },
  {
    id: "shoulder_press",
    displayName: "Shoulder Press",
    imageKey: "dumbbell-shoulder-press",
    movementPattern: "vertical_push",
    primaryMuscles: ["shoulders"],
    secondaryMuscles: ["triceps"],
    equipment: ["barbell", "dumbbell", "machine", "cable"],
    aliases: [
      "shoulder press",
      "overhead press",
      "military press",
      "arnold press",
      "one arm shoulder press",
      "cable shoulder press",
    ],
  },
  {
    id: "push_up",
    displayName: "Push-Up",
    imageKey: "push-up",
    movementPattern: "horizontal_push",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["triceps", "shoulders", "core"],
    equipment: ["body only"],
    aliases: [
      "push up",
      "push ups",
      "body up",
      "close grip push up",
      "one armed push up",
    ],
  },
  {
    id: "squat",
    displayName: "Squat",
    imageKey: "squats",
    movementPattern: "squat",
    primaryMuscles: ["quadriceps", "glutes"],
    secondaryMuscles: ["hamstrings", "core"],
    equipment: ["barbell", "body only", "smith", "machine"],
    aliases: [
      "squat",
      "barbell squat",
      "back squat",
      "full squat",
      "bodyweight squat",
      "box squat",
      "hack squat",
    ],
  },
  {
    id: "front_squat",
    displayName: "Front Squat",
    imageKey: "front-squat",
    movementPattern: "squat",
    primaryMuscles: ["quadriceps"],
    secondaryMuscles: ["glutes", "core"],
    equipment: ["barbell"],
    aliases: ["front squat", "front squat to bench"],
  },
  {
    id: "leg_press",
    displayName: "Leg Press",
    imageKey: "leg-press",
    movementPattern: "squat",
    primaryMuscles: ["quadriceps", "glutes"],
    secondaryMuscles: ["hamstrings"],
    equipment: ["machine"],
    aliases: ["leg press", "narrow stance leg press"],
  },
  {
    id: "lunge",
    displayName: "Lunge",
    imageKey: "lunges",
    movementPattern: "lunge",
    primaryMuscles: ["quadriceps", "glutes"],
    secondaryMuscles: ["hamstrings", "calves"],
    equipment: ["barbell", "dumbbell", "body only"],
    aliases: [
      "lunge",
      "lunges",
      "rear lunge",
      "reverse lunge",
      "walking lunge",
      "bodyweight walking lunge",
      "barbell lunge",
    ],
  },
  {
    id: "step_up",
    displayName: "Step-Up",
    imageKey: "step-ups",
    movementPattern: "lunge",
    primaryMuscles: ["quadriceps", "glutes"],
    secondaryMuscles: ["hamstrings"],
    equipment: ["body only", "barbell", "dumbbell"],
    aliases: ["step up", "step ups", "barbell step ups"],
  },
  {
    id: "deadlift",
    displayName: "Deadlift",
    imageKey: "dead-lifts",
    movementPattern: "hinge",
    primaryMuscles: ["hamstrings", "glutes", "back"],
    secondaryMuscles: ["traps", "core"],
    equipment: ["barbell", "dumbbell", "cable"],
    aliases: [
      "deadlift",
      "dead lift",
      "dead lifts",
      "barbell deadlift",
      "axle deadlift",
      "cable deadlift",
    ],
  },
  {
    id: "good_morning",
    displayName: "Good Morning",
    imageKey: "good-mornings",
    movementPattern: "hinge",
    primaryMuscles: ["hamstrings", "glutes", "lower back"],
    secondaryMuscles: ["core"],
    equipment: ["barbell", "band"],
    aliases: ["good morning", "good mornings", "band good morning"],
  },
  {
    id: "row",
    displayName: "Row",
    imageKey: "reverse-grip-bent-over-rows",
    movementPattern: "horizontal_pull",
    primaryMuscles: ["back", "lats"],
    secondaryMuscles: ["biceps", "rear delts"],
    equipment: ["barbell", "dumbbell", "cable", "machine"],
    aliases: [
      "row",
      "barbell row",
      "bent over row",
      "dumbbell row",
      "rear delt row",
      "body row",
      "t bar row",
      "long bar row",
      "seated row",
    ],
  },
  {
    id: "pull_up",
    displayName: "Pull-Up",
    imageKey: "chin-ups",
    movementPattern: "vertical_pull",
    primaryMuscles: ["lats", "back"],
    secondaryMuscles: ["biceps"],
    equipment: ["body only"],
    aliases: [
      "pull up",
      "pull ups",
      "chin up",
      "chin ups",
      "band assisted pull up",
    ],
  },
  {
    id: "lat_pulldown",
    displayName: "Lat Pulldown",
    imageKey: "close-grip-front-lat-pull-down",
    movementPattern: "vertical_pull",
    primaryMuscles: ["lats"],
    secondaryMuscles: ["biceps", "back"],
    equipment: ["cable", "machine"],
    aliases: [
      "lat pulldown",
      "pull down",
      "pulldown",
      "underhand pull down",
      "v bar pull down",
    ],
  },
  {
    id: "biceps_curl",
    displayName: "Biceps Curl",
    imageKey: "bicep-curls",
    movementPattern: "elbow_flexion",
    primaryMuscles: ["biceps"],
    secondaryMuscles: ["forearms"],
    equipment: ["barbell", "dumbbell", "cable"],
    aliases: [
      "curl",
      "bicep curl",
      "biceps curl",
      "barbell curl",
      "dumbbell curl",
      "preacher curl",
      "concentration curl",
      "spider curl",
    ],
  },
  {
    id: "hammer_curl",
    displayName: "Hammer Curl",
    imageKey: "bicep-hammer-curl",
    movementPattern: "elbow_flexion",
    primaryMuscles: ["biceps", "brachialis"],
    secondaryMuscles: ["forearms"],
    equipment: ["dumbbell", "cable"],
    aliases: ["hammer curl", "alternate hammer curl", "rope hammer curl"],
  },
  {
    id: "triceps_extension",
    displayName: "Triceps Extension",
    imageKey: "one-arm-triceps-extension",
    movementPattern: "elbow_extension",
    primaryMuscles: ["triceps"],
    secondaryMuscles: [],
    equipment: ["dumbbell", "cable", "barbell"],
    aliases: [
      "triceps extension",
      "tricep extension",
      "skull crusher",
      "kickback",
      "triceps press",
      "low triceps extension",
    ],
  },
  {
    id: "dip",
    displayName: "Dip",
    imageKey: "bench-dips",
    movementPattern: "vertical_push",
    primaryMuscles: ["triceps", "chest"],
    secondaryMuscles: ["shoulders"],
    equipment: ["body only", "bench"],
    aliases: ["dip", "dips", "bench dip", "bench dips", "tricep dips"],
  },
  {
    id: "lateral_raise",
    displayName: "Lateral Raise",
    imageKey: "dumbbell-lateral-raises",
    movementPattern: "shoulder_isolation",
    primaryMuscles: ["shoulders"],
    secondaryMuscles: [],
    equipment: ["dumbbell", "cable"],
    aliases: [
      "lateral raise",
      "side lateral",
      "deltoid raise",
      "front raise",
      "rear lateral raise",
      "cable lateral raise",
    ],
  },
  {
    id: "shrug",
    displayName: "Shrug",
    imageKey: "barbell-shrugs",
    movementPattern: "trap_isolation",
    primaryMuscles: ["traps"],
    secondaryMuscles: [],
    equipment: ["barbell", "dumbbell", "cable", "smith"],
    aliases: [
      "shrug",
      "shrugs",
      "barbell shrug",
      "dumbbell shrug",
      "cable shrug",
      "smith machine shrug",
    ],
  },
  {
    id: "crunch",
    displayName: "Crunch",
    imageKey: "crunches",
    movementPattern: "core",
    primaryMuscles: ["abdominals"],
    secondaryMuscles: [],
    equipment: ["body only", "machine", "cable"],
    aliases: [
      "crunch",
      "crunches",
      "ab crunch",
      "cable crunch",
      "decline crunch",
      "stability ball crunch",
    ],
  },
  {
    id: "leg_raise",
    displayName: "Leg Raise",
    imageKey: "leg-raises",
    movementPattern: "core",
    primaryMuscles: ["abdominals", "hip flexors"],
    secondaryMuscles: [],
    equipment: ["body only"],
    aliases: [
      "leg raise",
      "leg raises",
      "leg lift",
      "bent knee hip raise",
      "flutter kicks",
    ],
  },
  {
    id: "plank",
    displayName: "Plank",
    imageKey: "side-plank",
    movementPattern: "core",
    primaryMuscles: ["core"],
    secondaryMuscles: ["shoulders", "glutes"],
    equipment: ["body only"],
    aliases: ["plank", "side plank", "superman"],
  },
  {
    id: "calf_raise",
    displayName: "Calf Raise",
    imageKey: "standing-leg-curl",
    movementPattern: "calf_raise",
    primaryMuscles: ["calves"],
    secondaryMuscles: [],
    equipment: ["body only", "barbell", "dumbbell", "machine"],
    aliases: ["calf raise", "standing calf raise", "seated calf raise"],
  },
];

const FAMILY_BY_ID = new Map(
  CANONICAL_EXERCISES.map((family) => [family.id, family]),
);
const IMAGE_KEY_ALIASES = new Map([
  ["bench-press", "bench-pres"],
  ["incline-bench-press", "incline-bench-pres"],
  ["dumbbell-shoulder-press", "dumbbell-shoulder-pres"],
  ["squats", "squat"],
  ["dead-lifts", "dead-lift"],
  ["good-mornings", "good-morning"],
  ["push-up", "push-ups"],
]);

/**
 * Converts names, slugs and image keys into a safe comparison format.
 */
export function normaliseExerciseText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Creates a stable slug/key from any exercise text.
 */
export function slugifyExercise(value) {
  return normaliseExerciseText(value).replace(/\s+/g, "-");
}

function resolveLibraryExercise(exercise) {
  const candidates = [
    exercise?.libraryId,
    exercise?.id,
    exercise?.slug,
    exercise?.name,
  ]
    .filter(Boolean)
    .map(normaliseExerciseText);

  return exerciseLibrary.find((libraryExercise) => {
    const libraryCandidates = [
      libraryExercise.id,
      libraryExercise.slug,
      libraryExercise.name,
    ]
      .filter(Boolean)
      .map(normaliseExerciseText);

    return candidates.some((candidate) =>
      libraryCandidates.includes(candidate),
    );
  });
}

function scoreFamily(exerciseName, family) {
  const exerciseText = normaliseExerciseText(exerciseName);

  if (!exerciseText) return 0;

  const aliases = [family.displayName, family.imageKey, ...family.aliases];

  return aliases.reduce((bestScore, alias) => {
    const aliasText = normaliseExerciseText(alias);

    if (exerciseText === aliasText) return Math.max(bestScore, 100);
    if (exerciseText.includes(aliasText)) return Math.max(bestScore, 92);
    if (aliasText.includes(exerciseText)) return Math.max(bestScore, 88);

    const exerciseWords = new Set(exerciseText.split(" "));
    const aliasWords = new Set(aliasText.split(" "));
    const overlap = [...exerciseWords].filter((word) =>
      aliasWords.has(word),
    ).length;
    const score = Math.round(
      (overlap / Math.max(exerciseWords.size, aliasWords.size)) * 100,
    );

    return Math.max(bestScore, score);
  }, 0);
}

function findBestFamily(exercise) {
  const libraryExercise = resolveLibraryExercise(exercise);
  const exerciseName =
    libraryExercise?.name || exercise?.name || exercise?.id || "";

  const rankedFamilies = CANONICAL_EXERCISES.map((family) => ({
    family,
    score: scoreFamily(exerciseName, family),
  })).sort((a, b) => b.score - a.score);

  const bestMatch = rankedFamilies[0];
  return bestMatch?.score >= 50 ? bestMatch.family : null;
}

function getMappedImage(imageKey) {
  const key = slugifyExercise(imageKey);
  const aliasKey = IMAGE_KEY_ALIASES.get(key);

  return (
    exerciseImageMap[key] ||
    (aliasKey ? exerciseImageMap[aliasKey] : null) ||
    null
  );
}

/**
 * Resolves any TrackFit exercise-like object into a canonical movement family.
 */
export function resolveExercise(exercise) {
  const libraryExercise = resolveLibraryExercise(exercise);
  const family =
    FAMILY_BY_ID.get(exercise?.canonicalId) || findBestFamily(exercise);
  const fallbackKey = slugifyExercise(
    libraryExercise?.name || exercise?.name || exercise?.id || "exercise",
  );
  const imageKey =
    family?.imageKey ||
    libraryExercise?.slug ||
    exercise?.imageKey ||
    fallbackKey;
  const mappedImage = getMappedImage(imageKey) || getMappedImage(fallbackKey);

  return {
    canonicalId: family?.id || fallbackKey,
    displayName:
      family?.displayName ||
      libraryExercise?.name ||
      exercise?.name ||
      "Exercise",
    imageKey,
    image:
      mappedImage ||
      exercise?.image ||
      libraryExercise?.image ||
      FALLBACK_EXERCISE_IMAGE,
    movementPattern:
      family?.movementPattern ||
      libraryExercise?.movementPattern ||
      exercise?.movementPattern ||
      "unknown",
    primaryMuscles:
      family?.primaryMuscles ||
      libraryExercise?.primaryMuscles ||
      exercise?.primaryMuscles ||
      [],
    secondaryMuscles:
      family?.secondaryMuscles ||
      libraryExercise?.secondaryMuscles ||
      exercise?.secondaryMuscles ||
      [],
    equipment:
      family?.equipment ||
      libraryExercise?.equipment ||
      exercise?.equipment ||
      [],
    libraryExercise,
    family,
  };
}

/**
 * Public helper for components that only need an image path.
 */
export function resolveExerciseImage(exercise) {
  return resolveExercise(exercise).image || FALLBACK_EXERCISE_IMAGE;
}

export { CANONICAL_EXERCISES, FALLBACK_EXERCISE_IMAGE };

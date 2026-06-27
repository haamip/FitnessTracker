import fs from "node:fs";
import path from "node:path";

/*
  TrackFit Exercise Importer

  This script takes the raw open-source exercise database and converts it into
  our own TrackFit exercise schema.

  Think of this as the "AI preparation layer".

  The AI Builder should NOT guess from messy raw data.
  Instead, it should use clean, structured exercise objects like:
  - muscle groups
  - equipment
  - movement pattern
  - default sets/reps/rest
  - searchable tags
  - difficulty level

  Later, when the AI builds a workout, it will pick exercises from this library
  based on the user's goal, equipment, experience, time, and injuries.
*/

const root = process.cwd();

const sourcePath = path.join(
  root,
  "external",
  "free-exercise-db",
  "dist",
  "exercises.json",
);

const outputPath = path.join(root, "src", "data", "exerciseLibrary.js");

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/*
  This function is one of the most important parts.

  It guesses the movement pattern from muscles/category/name.
  That means the AI Builder can later say:

  "I need a horizontal push exercise"
  and find Bench Press, Dumbbell Bench, Machine Chest Press, Push Up, etc.

  Without movement patterns, the AI would only have muscle names,
  which is not enough for building balanced workouts.
*/
function getMovementPattern(exercise) {
  const name = exercise.name.toLowerCase();
  const category = exercise.category || "";
  const primary = exercise.primaryMuscles || [];

  if (category === "stretching") return "mobility";
  if (category === "cardio") return "conditioning";

  if (name.includes("squat") || name.includes("leg press") || name.includes("lunge")) {
    return "squat";
  }

  if (name.includes("deadlift") || name.includes("hinge") || name.includes("romanian")) {
    return "hinge";
  }

  if (name.includes("bench") || name.includes("press") || name.includes("push-up")) {
    if (primary.includes("chest")) return "horizontal_push";
    if (primary.includes("shoulders")) return "vertical_push";
  }

  if (name.includes("row")) return "horizontal_pull";
  if (name.includes("pulldown") || name.includes("pullup") || name.includes("pull-up")) {
    return "vertical_pull";
  }

  if (primary.includes("abdominals")) return "core";
  if (primary.includes("biceps")) return "elbow_flexion";
  if (primary.includes("triceps")) return "elbow_extension";
  if (primary.includes("calves")) return "calf_raise";

  return "unknown";
}

/*
  These defaults are not random.

  They give TrackFit a sensible starting point when a user adds an exercise.
  Later, the AI Builder can override these depending on the goal:
  - strength = heavier, fewer reps, longer rest
  - muscle = moderate reps/rest
  - fat loss = higher reps, shorter rest
*/
function getDefaults(exercise, movementPattern) {
  const difficulty = exercise.level || "beginner";

  if (movementPattern === "conditioning") {
    return {
      defaultSets: 1,
      defaultReps: "10-20 min",
      defaultRestSeconds: 60,
    };
  }

  if (movementPattern === "mobility") {
    return {
      defaultSets: 2,
      defaultReps: "30-45 sec",
      defaultRestSeconds: 30,
    };
  }

  if (difficulty === "expert") {
    return {
      defaultSets: 4,
      defaultReps: "5-8",
      defaultRestSeconds: 120,
    };
  }

  return {
    defaultSets: 3,
    defaultReps: "8-12",
    defaultRestSeconds: 90,
  };
}

/*
  This creates searchable tags.

  The Exercise Picker and AI Builder will both use these.
  Example:
  User searches "chest dumbbell press"
  TrackFit can match:
  - chest
  - dumbbell
  - press
  - horizontal_push
*/
function buildTags(exercise, movementPattern) {
  return [
    exercise.name,
    exercise.category,
    exercise.equipment,
    exercise.level,
    movementPattern,
    ...(exercise.primaryMuscles || []),
    ...(exercise.secondaryMuscles || []),
  ]
    .filter(Boolean)
    .map((tag) => tag.toLowerCase());
}

/*
  This converts one raw exercise into one TrackFit exercise.

  This is the schema the whole app will use:
  - Workout logger
  - Add Exercise picker
  - AI Workout Builder
  - future AI Coach
  - future form analysis
*/
function normaliseExercise(exercise) {
  const slug = slugify(exercise.name);
  const movementPattern = getMovementPattern(exercise);
  const defaults = getDefaults(exercise, movementPattern);

  return {
    id: slug,
    name: exercise.name,
    slug,

    primaryMuscles: exercise.primaryMuscles || [],
    secondaryMuscles: exercise.secondaryMuscles || [],

    equipment: exercise.equipment ? [exercise.equipment] : [],
    category: exercise.category || "strength",
    movementPattern,

    difficulty: exercise.level || "beginner",

    ...defaults,

    instructions: exercise.instructions || [],
    tips: [],

    image: `/exercise-images/${slug}.svg`,
    imageLicense: "Pending image match",
    imageAttribution: "Pending image match",

    tags: buildTags(exercise, movementPattern),
  };
}

if (!fs.existsSync(sourcePath)) {
  console.error("Could not find free-exercise-db exercises.json");
  console.error(sourcePath);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(sourcePath, "utf8"));

const library = raw
  .map(normaliseExercise)
  .sort((a, b) => a.name.localeCompare(b.name));

const output = `// Auto-generated by scripts/importExercises.js
// Do not edit this file manually.
// Run: node scripts/importExercises.js

/*
  TrackFit Exercise Library

  This file is the cleaned exercise source of truth.

  The AI Workout Builder should use this file instead of hardcoded presets.
  That way the AI can build workouts using real exercises, muscles,
  equipment, movement patterns, and default training settings.
*/

export const exerciseLibrary = ${JSON.stringify(library, null, 2)};
`;

fs.writeFileSync(outputPath, output, "utf8");

console.log(`Imported ${library.length} exercises`);
console.log(`Saved to ${outputPath}`);
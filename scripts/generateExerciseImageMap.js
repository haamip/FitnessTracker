// ============================================================================
// TrackFit Image Mapper v2
// ----------------------------------------------------------------------------
// Scans the OpenTraining image library, matches exercise names to illustration
// files, copies matched images into public/exercise-images, and generates the
// runtime image map used by ExerciseImage.jsx.
// ============================================================================

import fs from "fs";
import path from "path";

const root = process.cwd();

const exerciseDataPath = path.join(root, "src", "data", "exerciseLibrary.js");
const imageSourceDir = path.join(root, "external", "opentraining-exercises");
const publicImageDir = path.join(root, "public", "exercise-images");
const mapOutputPath = path.join(root, "src", "data", "exerciseImageMap.js");
const reviewOutputPath = path.join(root, "src", "data", "exerciseImageReview.json");

const imageExtensions = [".png", ".jpg", ".jpeg", ".webp", ".svg"];

const weakWords = new Set([
  "barbell",
  "dumbbell",
  "dumbbells",
  "cable",
  "machine",
  "smith",
  "seated",
  "standing",
  "lying",
  "single",
  "one",
  "arm",
  "leg",
  "with",
  "on",
  "using",
  "weighted",
]);

const aliases = new Map([
  ["bb", "barbell"],
  ["db", "dumbbell"],
  ["presses", "press"],
  ["raises", "raise"],
  ["rows", "row"],
  ["curls", "curl"],
  ["flyes", "fly"],
  ["flies", "fly"],
  ["squats", "squat"],
  ["lunges", "lunge"],
  ["deadlifts", "deadlift"],
  ["dead", "deadlift"],
  ["chins", "chin"],
  ["chinups", "chin up"],
  ["pullups", "pull up"],
  ["pushups", "push up"],
]);

function normalise(value) {
  return String(value)
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/-\d+-\d+$/g, "")
    .replace(/-\d+$/g, "")
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normaliseWord(word) {
  const clean = normalise(word);
  if (aliases.has(clean)) return aliases.get(clean);
  if (clean.length > 4 && clean.endsWith("s")) return clean.slice(0, -1);
  return clean;
}

function words(value, options = {}) {
  const source = normalise(value)
    .split(" ")
    .flatMap((word) => normaliseWord(word).split(" "))
    .filter(Boolean);

  if (!options.removeWeakWords) return source;

  return source.filter((word) => !weakWords.has(word));
}

function stableKey(value) {
  return words(value).join("-");
}

function sortedKey(value, options = {}) {
  return [...new Set(words(value, options))].sort().join(" ");
}

function walkImages(directory) {
  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) return walkImages(fullPath);

    return imageExtensions.includes(path.extname(entry.name).toLowerCase())
      ? [fullPath]
      : [];
  });
}

function readExerciseNames() {
  const raw = fs.readFileSync(exerciseDataPath, "utf8");
  const matches = [...raw.matchAll(/["']?name["']?\s*:\s*["'`](.*?)["'`]/g)];

  return [...new Set(matches.map((match) => match[1]).filter(Boolean))];
}

function wordOverlapScore(a, b, options = {}) {
  const aWords = new Set(words(a, options));
  const bWords = new Set(words(b, options));

  if (!aWords.size || !bWords.size) return 0;

  const overlap = [...aWords].filter((word) => bWords.has(word)).length;
  const total = Math.max(aWords.size, bWords.size);

  return Math.round((overlap / total) * 100);
}

function scoreMatch(exerciseName, filename) {
  const exercise = normalise(exerciseName);
  const image = normalise(filename);

  if (!exercise || !image) return 0;

  if (exercise === image) return 100;
  if (sortedKey(exercise) === sortedKey(image)) return 98;
  if (image.includes(exercise)) return 96;
  if (exercise.includes(image)) return 92;

  if (
    sortedKey(exercise, { removeWeakWords: true }) &&
    sortedKey(exercise, { removeWeakWords: true }) ===
      sortedKey(image, { removeWeakWords: true })
  ) {
    return 94;
  }

  const strictOverlap = wordOverlapScore(exercise, image);
  const cleanOverlap = wordOverlapScore(exercise, image, { removeWeakWords: true });

  return Math.max(strictOverlap, cleanOverlap);
}

function copyMatchedImage(sourcePath, exerciseKey) {
  const extension = path.extname(sourcePath).toLowerCase();
  const outputFilename = `${exerciseKey}${extension}`;
  const outputPath = path.join(publicImageDir, outputFilename);

  fs.copyFileSync(sourcePath, outputPath);

  return `/exercise-images/${outputFilename}`;
}

fs.mkdirSync(publicImageDir, { recursive: true });

const exercises = readExerciseNames();
const images = walkImages(imageSourceDir);

const imageMap = {};
const review = [];

for (const exerciseName of exercises) {
  const exerciseKey = stableKey(exerciseName);

  const rankedMatches = images
    .map((imagePath) => ({
      imagePath,
      filename: path.basename(imagePath),
      score: scoreMatch(exerciseName, path.basename(imagePath)),
    }))
    .sort((a, b) => b.score - a.score);

  const bestMatch = rankedMatches[0];

  if (bestMatch && bestMatch.score >= 72) {
    imageMap[exerciseKey] = copyMatchedImage(bestMatch.imagePath, exerciseKey);
  } else {
    review.push({
      exerciseName,
      exerciseKey,
      bestGuess: bestMatch?.filename ?? null,
      score: bestMatch?.score ?? 0,
      topGuesses: rankedMatches.slice(0, 5).map((match) => ({
        filename: match.filename,
        score: match.score,
      })),
    });
  }
}

const mapFile = `// ============================================================================
// TrackFit Exercise Image Map
// ----------------------------------------------------------------------------
// Auto-generated by scripts/generateExerciseImageMap.js.
// Do not edit manually.
// ============================================================================

export const exerciseImageMap = ${JSON.stringify(imageMap, null, 2)};

export function getExerciseImageByKey(key) {
  return exerciseImageMap[key] || null;
}
`;

fs.writeFileSync(mapOutputPath, mapFile, "utf8");
fs.writeFileSync(reviewOutputPath, JSON.stringify(review, null, 2), "utf8");

console.log("");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("TrackFit Image Mapper v2");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`Exercises:      ${exercises.length}`);
console.log(`Images found:   ${images.length}`);
console.log(`Mapped:         ${Object.keys(imageMap).length}`);
console.log(`Needs review:   ${review.length}`);
console.log("");
console.log(`Saved:          ${path.relative(root, mapOutputPath)}`);
console.log(`Review:         ${path.relative(root, reviewOutputPath)}`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("");
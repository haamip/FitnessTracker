/**
 * Public-domain exercise catalogue from yuhonas/free-exercise-db (Unlicense).
 * https://github.com/yuhonas/free-exercise-db
 *
 * Loads on demand, keeps a small local cache for repeat/offline use, and
 * always allows the built-in TrackFit library to work if the host is offline.
 */
const DATA_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const IMAGE_ROOT = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";
const CACHE_KEY = "trackfit_free_exercise_db_v1";
const CACHE_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
let pendingRequest = null;

function imageUrl(imagePath) {
  if (!imagePath || typeof imagePath !== "string") return "";
  // Prevent arbitrary remote URLs in library data; only use dataset-relative media.
  if (!/^[a-z0-9_()'.%+\- ]+\/[a-z0-9_()'.%+\- ]+\.(jpg|jpeg|png)$/i.test(imagePath)) return "";
  return IMAGE_ROOT + imagePath.split("/").map(encodeURIComponent).join("/");
}

export function normaliseFreeExercise(record) {
  if (!record || typeof record.name !== "string" || typeof record.id !== "string") return null;
  const name = record.name.trim();
  if (!name) return null;
  const equipment = record.equipment ? [String(record.equipment)] : ["body only"];
  return {
    id: `free-db-${record.id}`,
    name,
    image: imageUrl(record.images?.[0]),
    alternateImage: imageUrl(record.images?.[1]),
    primaryMuscles: Array.isArray(record.primaryMuscles) ? record.primaryMuscles : [],
    secondaryMuscles: Array.isArray(record.secondaryMuscles) ? record.secondaryMuscles : [],
    equipment,
    difficulty: record.level || "intermediate",
    movementPattern: record.mechanic || "unknown",
    category: record.category || "strength",
    instructions: Array.isArray(record.instructions) ? record.instructions : [],
    defaultSets: 3,
    defaultReps: "8-12",
    defaultRestSeconds: 90,
    source: "free-exercise-db",
  };
}

function readCachedCatalog() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (!cached || !Array.isArray(cached.exercises)) return null;
    return cached;
  } catch {
    return null;
  }
}

export function getCachedFreeExercises() {
  return readCachedCatalog()?.exercises || [];
}

export async function loadFreeExerciseCatalog() {
  const cached = readCachedCatalog();
  if (cached?.exercises?.length && Date.now() - cached.savedAt < CACHE_LIFETIME_MS) {
    return cached.exercises;
  }
  if (pendingRequest) return pendingRequest;

  pendingRequest = (async () => {
    try {
      const response = await fetch(DATA_URL, { signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error("Free exercise library unavailable");
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Invalid free exercise library");
      const exercises = data.map(normaliseFreeExercise).filter(Boolean);
      if (exercises.length === 0) throw new Error("Free exercise library is empty");
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), exercises }));
      } catch {
        // Local storage might be full; use the downloaded catalogue in memory.
      }
      return exercises;
    } catch (error) {
      if (cached?.exercises?.length) return cached.exercises;
      throw error;
    } finally {
      pendingRequest = null;
    }
  })();

  return pendingRequest;
}

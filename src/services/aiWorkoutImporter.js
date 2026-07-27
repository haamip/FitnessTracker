import { isSupabaseConfigured, supabase } from "./supabaseClient";

function normaliseExercise(exercise, index) {
  const sets = Number.parseInt(exercise?.sets, 10);
  const repsMin = String(exercise?.repsMin ?? "").trim();
  const repsMax = String(exercise?.repsMax ?? "").trim();
  const reps = repsMin && repsMax && repsMin !== repsMax ? `${repsMin}-${repsMax}` : repsMin || repsMax;

  return {
    id: `ai-import-${crypto.randomUUID?.() || `${Date.now()}-${index}`}`,
    name: String(exercise?.name || "").trim(),
    sets: Number.isFinite(sets) && sets > 0 ? String(sets) : "",
    reps,
    note: String(exercise?.note || "").trim(),
    equipment: String(exercise?.equipment || "unknown").trim().toLowerCase(),
    source: "AI workout importer",
    confidence: exercise?.confidence || "medium",
    needsReview: !sets || !reps || exercise?.confidence === "low",
  };
}

export async function parseWorkoutWithAI({ text, localResult }) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured on this device.");
  }

  const { data, error } = await supabase.functions.invoke("parse-workout", {
    body: {
      text,
      localResult: {
        exercises: localResult?.exercises?.map(({ name, sets, reps, note, confidence }) => ({
          name,
          sets,
          reps,
          note,
          confidence,
        })) || [],
        ignoredLines: localResult?.ignoredLines || [],
      },
    },
  });

  if (error) throw new Error(error.message || "The AI importer could not be reached.");
  if (!data?.exercises || !Array.isArray(data.exercises)) {
    throw new Error("The AI importer returned an invalid workout.");
  }

  return {
    workoutName: String(data.workoutName || "").trim(),
    exercises: data.exercises.map(normaliseExercise).filter((exercise) => exercise.name),
    ignoredLines: Array.isArray(data.ignoredLines) ? data.ignoredLines : [],
  };
}

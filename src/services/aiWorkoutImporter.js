import { supabase } from "./supabase";

export function normaliseImportedExercise(exercise, index) {
  const sets = Number(exercise?.sets);
  const repsMin = String(exercise?.repsMin ?? "").trim().slice(0, 35);
  const repsMax = String(exercise?.repsMax ?? "").trim().slice(0, 35);
  const reps = repsMin && repsMax && repsMin !== repsMax
    ? `${repsMin}-${repsMax}` : repsMin || repsMax;
  const validSets = Number.isInteger(sets) && sets >= 1 && sets <= 30;
  return {
    id: `ai-import-${crypto.randomUUID?.() || `${Date.now()}-${index}`}`,
    name: String(exercise?.name || "").trim().slice(0, 110),
    sets: validSets ? String(sets) : "",
    reps,
    note: String(exercise?.note || "").trim().slice(0, 250),
    equipment: String(exercise?.equipment || "unknown").trim().toLowerCase(),
    source: "AI workout importer",
    confidence: exercise?.confidence || "medium",
    needsReview: !validSets || !reps || exercise?.confidence === "low",
  };
}

export async function parseWorkoutWithAI({ text, localResult }) {
  if (!supabase) throw new Error("TrackFit account connection is unavailable.");
  const workoutText = String(text || "").trim();
  if (!workoutText) throw new Error("Paste your workout or upload a PDF first.");
  if (workoutText.length > 16000) {
    throw new Error("AI reader supports up to 16,000 characters. Shorten the workout and try again.");
  }
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user || user.is_anonymous) throw new Error("Sign into TrackFit to use the AI reader.");

  const { data, error } = await supabase.functions.invoke("parse-workout", {
    body: {
      text: workoutText,
      localResult: {
        exercises: (localResult?.exercises || []).slice(0, 25)
          .map(({ name, sets, reps, note }) => ({ name, sets, reps, note })),
      },
    },
  });

  if (error) {
    let details = "";
    try {
      const body = await error.context?.json();
      details = typeof body?.error === "string" ? body.error.slice(0, 220) : "";
    } catch { /* Network and timeout errors can have no JSON response. */ }
    throw new Error(details || "Could not reach the live AI reader. Try Quick parse or check your connection.");
  }
  if (data?.mode !== "live" || !Array.isArray(data.exercises)) {
    throw new Error("The AI reader did not return a verified live workout.");
  }
  const exercises = data.exercises.slice(0, 25).map(normaliseImportedExercise)
    .filter(exercise => exercise.name);
  if (!exercises.length) throw new Error("AI couldn't find any exercises. Try Quick parse or paste different text.");

  return {
    workoutName: String(data.workoutName || "").trim().slice(0, 110),
    exercises,
    ignoredLines: Array.isArray(data.ignoredLines)
      ? data.ignoredLines.slice(0, 20).map(x => String(x).slice(0, 120)) : [],
  };
}

/** Validate a copied workout before converting it into executable sets. */
export function isUsableWorkoutExercise(exercise) {
  const name = String(exercise?.name ?? "").trim();
  const setsString = String(exercise?.sets ?? "").trim();
  const reps = String(exercise?.reps ?? "").trim();
  const sets = Number(setsString);
  return Boolean(
    name &&
    /^\d+$/.test(setsString) &&
    Number.isInteger(sets) &&
    sets >= 1 &&
    sets <= 30 &&
    reps &&
    reps !== "0",
  );
}

/** Applies an opt-in Health Connect step import without replacing existing check-in answers. */
export function mergeImportedSteps(existing, date, imported) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Invalid local step date.");
  if (existing?.date && existing.date !== date) throw new Error("Can't overwrite another day's check-in.");
  if (!Number.isSafeInteger(imported?.steps) || imported.steps < 1 || imported.steps > 150000) {
    throw new Error("No valid steps were returned, so your saved check-in was left unchanged.");
  }
  if (!["health_connect", "apple_health"].includes(imported.stepsSource)) {
    throw new Error("Only authorised watch imports may update steps.");
  }
  return {
    ...(existing || {}),
    id: existing?.id || `checkin-${crypto.randomUUID()}`,
    date,
    steps: imported.steps,
    stepsSource: imported.stepsSource,
    stepsMode: imported.stepsSource === "health_connect" ? (imported.stepsMode === "samsung_health" ? "samsung_health" : "all") : null,
    stepsSyncedAt: imported.stepsSyncedAt || new Date().toISOString(),
    // Keep existing mood, workout/rest and other details; don't assume today is a rest day.
  };
}

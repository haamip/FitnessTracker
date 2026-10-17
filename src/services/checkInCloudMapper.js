// Safe translation between the 60-second local check-in and Supabase columns.
// Optional fields remain NULL when not entered. A missing value is not zero intake.
const SOURCES = new Set(["manual", "health_connect", "apple_health"]);
const ACTIVITIES = new Set(["workout", "cardio", "both", "rest"]);

function optionalNumber(value, min = 0, max = 100000) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
}
function optionalText(value, maxLength = 500) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : null;
}
function validDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}
export function toDailyCheckInCloudPayload(record, userId, clock = new Date()) {
  if (!record || !validDate(record.date) || !userId) throw new Error("Incomplete check-in.");
  const stepsRaw = optionalNumber(record.steps, 0, 150000);
  const steps = Number.isSafeInteger(stepsRaw) ? stepsRaw : null;
  const source = steps !== null && SOURCES.has(record.stepsSource) ? record.stepsSource : steps !== null ? "manual" : null;
  const syncedTime = source !== "manual" && source !== null && record.stepsSyncedAt && !Number.isNaN(new Date(record.stepsSyncedAt).getTime())
    ? new Date(record.stepsSyncedAt).toISOString() : null;
  const activity = ACTIVITIES.has(record.activityType)
    ? record.activityType
    : record.trainedToday === true || record.trained === true ? "workout" : "rest";
  return {
    user_id: userId,
    checkin_date: record.date,
    weight_kg: optionalNumber(record.weightKg ?? record.weight, 0, 1000),
    protein_g: optionalNumber(record.proteinG ?? record.protein, 0, 2000),
    water_l: optionalNumber(record.waterL ?? record.water, 0, 50),
    sleep_hours: optionalNumber(record.sleepHours ?? record.sleep, 0, 24),
    mood: optionalText(record.mood, 60) || "Okay",
    energy: optionalNumber(record.energy, 1, 10),
    body_feel: optionalText(record.bodyFeel ?? record.soreness, 60),
    activity_type: activity,
    trained_today: activity === "workout" || activity === "both",
    training_note: optionalText(record.trainingNote),
    steps,
    steps_source: source,
    steps_synced_at: syncedTime,
    updated_at: clock.toISOString(),
  };
}

export function fromDailyCheckInCloudRow(row) {
  if (!row || !validDate(row.checkin_date)) throw new Error("Invalid cloud check-in.");
  return {
    id: row.id,
    date: row.checkin_date,
    weightKg: row.weight_kg == null ? "" : Number(row.weight_kg),
    proteinG: row.protein_g == null ? "" : Number(row.protein_g),
    waterL: row.water_l == null ? "" : Number(row.water_l),
    sleepHours: row.sleep_hours == null ? "" : Number(row.sleep_hours),
    mood: row.mood || "Okay",
    energy: row.energy == null ? "" : Number(row.energy),
    bodyFeel: row.body_feel || "Mild",
    trainedToday: row.trained_today === true,
    trainingNote: row.training_note || "",
    activityType: ACTIVITIES.has(row.activity_type) ? row.activity_type : (row.trained_today ? "workout" : "rest"),
    steps: row.steps == null ? null : Number(row.steps),
    stepsSource: SOURCES.has(row.steps_source) ? row.steps_source : "manual",
    stepsSyncedAt: row.steps_synced_at || null,
    updatedAt: row.updated_at || null,
  };
}

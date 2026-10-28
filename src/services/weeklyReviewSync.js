const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const WEEK = /^\d{4}-\d{2}-\d{2}$/;

export function weeklyReviewCacheKey(userId) {
  if (!UUID.test(String(userId || ""))) throw new Error("Sign in to access weekly reviews.");
  return `trackfit_weekly_reviews_v1:${userId}`;
}
export const pendingWeeklyReviewsKey = userId => `${weeklyReviewCacheKey(userId)}:pending`;
export function validReviewWeek(value) {
  if (typeof value !== "string" || !WEEK.test(value)) return false;
  const d = new Date(value + "T12:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0,10) === value && d.getUTCDay() === 1;
}
export function fromCloudWeeklyReview(row) {
  return {
    weekStart: row.week_start,
    answers: row.answers && typeof row.answers === "object" && !Array.isArray(row.answers) ? row.answers : {},
    savedAt: row.updated_at,
  };
}
export function mergeWeeklyReviews(remote = [], local = [], pendingWeeks = []) {
  const pending = new Set(pendingWeeks.map(String));
  const records = new Map();
  for (const record of remote) if (validReviewWeek(record?.weekStart)) records.set(record.weekStart, record);
  for (const record of local) {
    if (!validReviewWeek(record?.weekStart)) continue;
    if (pending.has(record.weekStart) || !records.has(record.weekStart))
      records.set(record.weekStart, record);
  }
  return [...records.values()].sort((a,b)=>b.weekStart.localeCompare(a.weekStart));
}

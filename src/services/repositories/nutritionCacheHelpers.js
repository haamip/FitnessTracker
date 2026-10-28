/**
 * Stable UUIDs make offline meal upserts idempotent. Cache, pending writes
 * and delete tombstones are always scoped to the authenticated account.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isNutritionId = (value) => UUID.test(String(value || ""));
export function nutritionCacheKey(userId) {
  if (!isNutritionId(userId)) throw new Error("A signed-in TrackFit account is required.");
  return `trackfit_nutrition:${userId}`;
}
export const nutritionPendingKey = (userId) => `${nutritionCacheKey(userId)}:pending`;
export const nutritionDeletionsKey = (userId) => `${nutritionCacheKey(userId)}:deletions`;

export function fromNutritionCloudRow(row) {
  const nullableNumber = value => value == null ? null : Number(value);
  return {
    id: row.id, date: row.entry_date, type: row.meal_type, name: row.name,
    calories: Number(row.calories) || 0, protein: Number(row.protein_g) || 0,
    carbs: nullableNumber(row.carbs_g), fats: nullableNumber(row.fats_g),
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export function toNutritionCloudPayload(meal, userId) {
  if (!isNutritionId(userId) || !isNutritionId(meal?.id)) throw new Error("Valid account and meal IDs are required.");
  return {
    id: meal.id, user_id: userId, entry_date: meal.date, meal_type: meal.type,
    name: meal.name, calories: Number(meal.calories) || 0,
    protein_g: Number(meal.protein) || 0,
    carbs_g: Number(meal.carbs) || 0, fats_g: Number(meal.fats) || 0,
  };
}

export function mergeNutritionCache(remote = [], cached = [], pendingIds = [], deletedIds = []) {
  const deleted = new Set(deletedIds.map(String));
  const pending = new Set(pendingIds.map(String));
  const byId = new Map();
  for (const entry of cached) {
    if (entry?.id && !deleted.has(String(entry.id))) byId.set(String(entry.id), entry);
  }
  // A pending local edit outranks an older cloud snapshot; otherwise cloud wins.
  for (const entry of remote) {
    const id = String(entry?.id || "");
    if (id && !deleted.has(id) && !(pending.has(id) && byId.has(id))) byId.set(id, entry);
  }
  return [...byId.values()].sort((a, b) =>
    String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}

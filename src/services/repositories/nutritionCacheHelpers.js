/**
 * Nutrition caches must never be shared across different signed-in accounts.
 * Legacy device-wide entries are retained separately; no automatic ownership
 * assignment is safe for unowned health records.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function nutritionCacheKey(userId) {
  if (!UUID.test(String(userId || ""))) throw new Error("A signed-in TrackFit account is required.");
  return `trackfit_nutrition:${userId}`;
}
export function mergeNutritionCache(remote = [], cached = []) {
  const byId = new Map();
  for (const entry of cached) {
    if (entry?.id) byId.set(String(entry.id), entry);
  }
  // The server is authoritative for IDs that it knows about.
  for (const entry of remote) {
    if (entry?.id) byId.set(String(entry.id), entry);
  }
  return [...byId.values()].sort((a, b) =>
    String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}

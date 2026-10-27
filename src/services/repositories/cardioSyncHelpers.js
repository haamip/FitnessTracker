/**
 * Account-owned cardio cache with stable client UUIDs for retry-safe uploads.
 * Legacy device-wide history stays unclaimed until the user opts in.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function cardioCacheKey(userId) {
  if (!UUID.test(String(userId || ""))) throw new Error("A signed-in TrackFit account is required.");
  return `trackfit_cardio:${userId}`;
}
export function cardioPendingKey(userId) { return `${cardioCacheKey(userId)}:pending`; }
export function cardioDeletionsKey(userId) { return `${cardioCacheKey(userId)}:deletions`; }
export function canonicalCardioId(id) {
  const text = String(id || "").replace(/^cardio-/, "");
  return UUID.test(text) ? text : null;
}
export function mergeCloudCardio(remote = [], local = [], pending = [], deleted = []) {
  const pendingSet = new Set(pending.map(String));
  const deletedSet = new Set(deleted.map(String));
  const byId = new Map();
  for (const row of remote) {
    const key = canonicalCardioId(row.id);
    if (key && !deletedSet.has(key)) byId.set(key, row);
  }
  for (const row of local) {
    const key = canonicalCardioId(row.id);
    if (!key || deletedSet.has(key)) continue;
    if (pendingSet.has(String(row.id)) || !byId.has(key)) byId.set(key, row);
  }
  return [...byId.values()].sort((a,b) =>
    String(b.date || "").localeCompare(String(a.date || "")) ||
    String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}

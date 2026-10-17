const PREFIX = "trackfit_checkins";
const ACCOUNT_PATTERN = /^[0-9a-f-]{36}$/i;

export function checkInCacheKey(accountId) {
  if (typeof accountId !== "string" || !ACCOUNT_PATTERN.test(accountId)) {
    throw new Error("A signed-in TrackFit account is required for check-in storage.");
  }
  return `${PREFIX}:${accountId}`;
}

export function pendingCheckInsKey(accountId) {
  return `${checkInCacheKey(accountId)}:pending`;
}

function byMostRecent(a, b) {
  return String(b.date || "").localeCompare(String(a.date || ""));
}

/**
 * The server is authoritative for matching dates, except local unsynced edits.
 * Local-only dates remain in the offline cache and are not silently deleted.
 */
export function mergeCloudCheckIns(localRecords = [], remoteRecords = [], pendingDates = []) {
  const pending = new Set(pendingDates);
  const byDate = new Map();
  for (const remote of remoteRecords) {
    if (remote && typeof remote.date === "string") byDate.set(remote.date, remote);
  }
  for (const local of localRecords) {
    if (local && typeof local.date === "string" && (!byDate.has(local.date) || pending.has(local.date))) {
      byDate.set(local.date, local);
    }
  }
  return [...byDate.values()].sort(byMostRecent);
}

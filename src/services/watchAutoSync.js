import { CheckInRepository } from "./repositories/trackfitDataLayer";
import { localDateKey } from "./cardioSummary";
import { getWearableBridge, readWearableSteps } from "./wearableBridge";
import { supabase } from "./supabase";
import { getStepSourceMode } from "./stepSourcePreference";

const preferenceKey = (userId) => `trackfit_auto_watch_sync_${userId}`;
const attemptKey = (userId) => `trackfit_auto_watch_sync_last_${userId}`;
const MIN_INTERVAL_MS = 15 * 60 * 1000;
let inFlight = false;

export function isAutoWatchSyncEnabled(userId) {
  return Boolean(userId) && localStorage.getItem(preferenceKey(userId)) === "true";
}

export function setAutoWatchSyncEnabled(userId, enabled) {
  if (!userId) throw new Error("Sign in first to enable watch sync.");
  if (enabled) localStorage.setItem(preferenceKey(userId), "true");
  else {
    localStorage.removeItem(preferenceKey(userId));
    localStorage.removeItem(attemptKey(userId));
  }
}

/**
 * Opt-in foreground sync. Background collection is NOT supported or claimed.
 * Uses native Health Connect or Apple Health after a user-initiated setup.
 * No permission dialog is ever triggered automatically.
 */
export async function syncWatchOnForeground() {
  if (inFlight || !supabase) return null;
  const provider = getWearableBridge();
  if (!provider) return null;
  inFlight = true;
  try {
    const { data, error } = await supabase.auth.getUser();
    const userId = !error && data?.user?.id;
    if (!userId || !isAutoWatchSyncEnabled(userId)) return null;
    const status = await provider.bridge.getStatus();
    if (!status?.available || (provider.platform === "ios" ? !status.authorizationRequested : !status.stepsGranted)) return null;
    const now = Date.now();
    const previous = Number(localStorage.getItem(attemptKey(userId)) || 0);
    if (previous > 0 && now - previous < MIN_INTERVAL_MS) return null;
    localStorage.setItem(attemptKey(userId), String(now));
    const date = localDateKey();
    const sourceMode = getStepSourceMode(userId);
    const record = await readWearableSteps(date, provider, { sourceMode });
    const existing = CheckInRepository.getAll().find((item) => item.date === date);
    // A temporary Health Connect source issue shouldn't reduce a previously
    // imported step total; the user can still manually correct the check-in.
    if (existing?.stepsSource === record.stepsSource &&
        (provider.platform === "ios" || (existing.stepsMode || "all") === sourceMode) &&
        Number(existing.steps) > record.steps) return null;
    const saved = await CheckInRepository.saveStepsFromWatch(date, record);
    window.dispatchEvent(new CustomEvent("trackfit:watch-auto-synced", { detail: { date, steps: record.steps, sourceMode, cloudSaved: Boolean(saved?.cloudSaved) } }));
    return record;
  } catch (error) {
    console.warn("Automatic watch sync unavailable; manual sync is still available.", error);
    return null;
  } finally {
    inFlight = false;
  }
}

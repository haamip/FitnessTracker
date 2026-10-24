import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, ExternalLink, Footprints, RefreshCw, Smartphone, Watch } from "lucide-react";
import { CheckInRepository } from "../services/repositories/trackfitDataLayer";
import { localDateKey } from "../services/cardioSummary";
import { getWearableBridge, readWearableSteps } from "../services/wearableBridge";
import { inspectWatchConnection, isTrackFitNativeApp } from "../services/watchConnectionStatus";
import { isAutoWatchSyncEnabled, setAutoWatchSyncEnabled } from "../services/watchAutoSync";
import { supabase } from "../services/supabase";
import "./WatchSync.css";

function readTodaysCheckIn() {
  return CheckInRepository.getAll().find((record) => record.date === localDateKey()) || null;
}

export default function WatchSync() {
  const [nativeApp] = useState(isTrackFitNativeApp);
  const [provider] = useState(getWearableBridge);
  const [entry, setEntry] = useState(readTodaysCheckIn);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [operation, setOperation] = useState("");
  
  useEffect(() => {
    const update = () => setEntry(readTodaysCheckIn());
    window.addEventListener("trackfit:checkin-saved", update);
    window.addEventListener("trackfit:watch-auto-synced", update);
    return () => {
      window.removeEventListener("trackfit:checkin-saved", update);
      window.removeEventListener("trackfit:watch-auto-synced", update);
    };
  }, []);
  const [userId, setUserId] = useState(null);
  const [autoEnabled, setAutoEnabled] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadPreference() {
      if (!supabase) return;
      const { data, error } = await supabase.auth.getUser();
      if (active && !error && data.user?.id) {
        setUserId(data.user.id);
        setAutoEnabled(isAutoWatchSyncEnabled(data.user.id));
      }
    }
    void loadPreference();
    return () => { active = false; };
  }, []);

  function toggleAuto(enabled) {
    if (!connectedReader || !userId) return;
    setAutoWatchSyncEnabled(userId, enabled);
    setAutoEnabled(enabled);
    setStatus({
      state: enabled ? "ready" : "disabled",
      message: enabled
        ? "Enabled. TrackFit will refresh watch steps when the Android app opens or resumes, while permission is granted. It does not run constantly in the background."
        : "Automatic watch syncing is off. You can still use Sync steps from watch.",
    });
  }


  const connectedReader = nativeApp && Boolean(provider);
  const steps = Number(entry?.steps);
  const savedSteps = entry?.steps != null && Number.isFinite(steps) ? steps.toLocaleString() : "Not synced";
  const source = entry?.stepsSource === "health_connect" ? "Health Connect" :
    entry?.stepsSource === "apple_health" ? "Apple Health" :
    entry?.stepsSource === "manual" ? "Manual entry" : "Daily check-in";
  const lastSync = entry?.stepsSyncedAt ? new Date(entry.stepsSyncedAt) : null;
  const syncedTime = lastSync && !Number.isNaN(lastSync.getTime())
    ? new Intl.DateTimeFormat("en-AU", { hour: "numeric", minute: "2-digit" }).format(lastSync)
    : "";

  async function check() {
    if (busy) return;
    setBusy(true);
    setOperation("check");
    try {
      setStatus(await inspectWatchConnection());
    } catch (error) {
      setStatus({ state: "error", message: error.message || "Unable to check the connection." });
    } finally {
      setBusy(false);
      setOperation("");
    }
  }

  async function syncSteps() {
    if (!connectedReader || busy) return;
    setBusy(true);
    setOperation("sync");
    setStatus(null);
    try {
      const day = localDateKey();
      const record = await readWearableSteps(day, provider);
      const saved = await CheckInRepository.saveStepsFromWatch(day, record);
      setEntry(readTodaysCheckIn());
      setStatus({
        state: "read-success",
        message: `${record.steps.toLocaleString()} steps saved for today${saved?.cloudSaved ? " and backed up to your account." : " on this device. Cloud backup is pending."}`,
      });
    } catch (error) {
      setStatus({
        state: "read-error",
        message: error.message || "Couldn't read your watch steps. Your previous record hasn't changed.",
      });
    } finally {
      setBusy(false);
      setOperation("");
    }
  }

  return (
    <main className="screen tf-watch-sync">
      <section className="tf-watch-sync__hero">
        <Watch size={30} aria-hidden="true" />
        <p className="eyebrow">Wearables</p>
        <h1>Watch &amp; steps</h1>
        <p>Track your daily steps through Health Connect. Syncing is always your choice, and it never adds your cardio steps twice.</p>
      </section>

      <section className="tf-watch-sync__summary" aria-label="Today’s watch steps">
        <Footprints size={27} aria-hidden="true" />
        <div><span>Today's steps</span><strong>{savedSteps}</strong><small>{entry ? source : "No steps recorded in TrackFit today"}{syncedTime ? ` · synced ${syncedTime}` : ""}</small></div>
      </section>

      <section className="form-card tf-watch-sync__section">
        <h2>Connect your watch</h2>
        <p>Galaxy Watch → Samsung Health → Health Connect → TrackFit Android app.</p>
        {connectedReader ? (
          <>
            <p className="tf-watch-sync__hint">The Android health connector is available in this installed app. Check access, then import today's steps.</p>
            <label className="tf-watch-sync__auto">
              <input
                type="checkbox"
                checked={autoEnabled}
                disabled={!userId || busy}
                onChange={(event) => toggleAuto(event.target.checked)}
              />
              <span><strong>Sync automatically when I open TrackFit</strong>
                <small>Optional · Updates while the Android app is in use, at most every 15 minutes. No background health access.</small>
              </span>
            </label>
            <div className="tf-watch-sync__actions">
              <button type="button" disabled={busy} onClick={syncSteps} className="tf-watch-sync__primary">
                <RefreshCw size={18} aria-hidden="true" />
                {busy && operation === "sync" ? "Reading steps..." : "Sync steps from watch"}
              </button>
              <button type="button" disabled={busy} onClick={check} className="tf-watch-sync__secondary">
                {busy && operation === "check" ? "Checking..." : "Check Health Connect access"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="tf-watch-sync__notice" role="status">
              <AlertCircle size={20} aria-hidden="true" />
              <span>{nativeApp
                ? "This installed version of TrackFit doesn't have the Health Connect connector. A compatible Android build is required."
                : "You're viewing TrackFit in a web browser. Browsers cannot directly read Health Connect steps. Open a compatible installed TrackFit Android build to sync."}</span>
            </div>
            <p className="tf-watch-sync__hint">You can still use TrackFit in your browser and enter the step total from Samsung Health manually. Connecting your Samsung Health account to Health Connect alone does not give the browser permission to read it.</p>
          </>
        )}
        {status && (
          <p role="status" className={status.state === "read-success" || status.state === "ready" ? "tf-watch-sync__success" : "tf-watch-sync__notice"}>
            {status.state === "read-success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            {status.message}
          </p>
        )}
        <Link to="/checkin" className="tf-watch-sync__link">
          Enter steps manually or finish daily check-in <ExternalLink size={16} aria-hidden="true"/>
        </Link>
      </section>
      <section className="form-card tf-watch-sync__section">
        <h2>Samsung setup</h2>
        <ol>
          <li>Make sure your Galaxy Watch is syncing to Samsung Health.</li>
          <li>On your phone, open Health Connect and allow Samsung Health to write Steps.</li>
          <li>In a compatible TrackFit Android app, tap <strong>Sync steps from watch</strong> and grant TrackFit permission to read Steps.</li>
          <li>Check your daily step total above. It will show in Cardio and Dashboard after a refresh.</li>
        </ol>
        <p className="tf-watch-sync__hint"><Smartphone size={15} aria-hidden="true" /> TrackFit imports a daily total when you tap Sync; this isn't continuous background watch syncing.</p>
      </section>
    </main>
  );
}

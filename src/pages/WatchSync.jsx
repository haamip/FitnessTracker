import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, ChevronDown, ExternalLink, Footprints, RefreshCw, Watch } from "lucide-react";
import { CheckInRepository } from "../services/repositories/trackfitDataLayer";
import { localDateKey } from "../services/cardioSummary";
import { getWearableBridge, readWearableSteps } from "../services/wearableBridge";
import { inspectWatchConnection, isTrackFitNativeApp } from "../services/watchConnectionStatus";
import { isAutoWatchSyncEnabled, setAutoWatchSyncEnabled } from "../services/watchAutoSync";
import { supabase } from "../services/supabase";
import { getStepSourceMode, setStepSourceMode, stepSourceName } from "../services/stepSourcePreference";
import { getWatchChoice, initialWatchChoice, setWatchChoice, watchStepSource } from "../services/watchChoicePreference";
import StepSourceAudit from "../components/StepSourceAudit";
import "./WatchSync.css";

const watches = [
  { id: "samsung", name: "Samsung Galaxy Watch", help: "Use Samsung Health to share steps with Health Connect. TrackFit will prefer Samsung Health steps, rather than the combined phone total." },
  { id: "pixel_fitbit", name: "Pixel Watch / Fitbit", help: "Turn on steps sharing with Health Connect in your watch's companion app. TrackFit can read the steps that actually appear there." },
  { id: "garmin", name: "Garmin", help: "In Garmin Connect, enable sharing steps to Health Connect if your app/device supports it." },
  { id: "polar", name: "Polar", help: "In Polar Flow, enable Health Connect step sharing. Available metrics depend on your watch and app." },
  { id: "other", name: "Another watch", help: "Check whether your watch's official phone app can write steps to Android Health Connect." },
  { id: "apple", name: "Apple Watch", help: "Apple Watch uses Apple Health on iPhone. TrackFit's Android Health Connect integration cannot read it. iPhone sync is not available yet." },
  { id: "none", name: "No watch", help: "No problem. You can enter steps in your daily check-in." },
];

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
  const [userId, setUserId] = useState(null);
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [sourceMode, setSourceMode] = useState("all");
  const [watchChoice, setWatchChoiceState] = useState("");

  useEffect(() => {
    const update = () => setEntry(readTodaysCheckIn());
    window.addEventListener("trackfit:checkin-saved", update);
    window.addEventListener("trackfit:watch-auto-synced", update);
    return () => {
      window.removeEventListener("trackfit:checkin-saved", update);
      window.removeEventListener("trackfit:watch-auto-synced", update);
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadPreference() {
      if (!supabase) return;
      const { data, error } = await supabase.auth.getUser();
      if (active && !error && data.user?.id) {
        const id = data.user.id;
        const mode = getStepSourceMode(id);
        setUserId(id);
        setAutoEnabled(isAutoWatchSyncEnabled(id));
        setSourceMode(mode);
        setWatchChoiceState(initialWatchChoice(getWatchChoice(id), mode));
      }
    }
    void loadPreference();
    return () => { active = false; };
  }, []);

  const connectedReader = nativeApp && Boolean(provider);
  const selectedWatch = watches.find((watch) => watch.id === watchChoice);
  const canSync = connectedReader && Boolean(watchChoice) && watchChoice !== "none" && watchChoice !== "apple";
  const steps = Number(entry?.steps);
  const savedSteps = entry?.steps != null && Number.isFinite(steps) ? steps.toLocaleString() : "Not synced";
  const source = entry?.stepsSource === "health_connect" ? stepSourceName(entry.stepsMode) :
    entry?.stepsSource === "apple_health" ? "Apple Health" :
    entry?.stepsSource === "manual" ? "Manual entry" : "Daily check-in";
  const lastSync = entry?.stepsSyncedAt ? new Date(entry.stepsSyncedAt) : null;
  const syncedTime = lastSync && !Number.isNaN(lastSync.getTime())
    ? new Intl.DateTimeFormat("en-AU", { hour: "numeric", minute: "2-digit" }).format(lastSync)
    : "";

  function chooseWatch(choice) {
    if (busy) return;
    setWatchChoiceState(choice);
    setStatus(null);
    if (!userId) return;
    setWatchChoice(userId, choice);
    const mode = watchStepSource(choice);
    setStepSourceMode(userId, mode);
    setSourceMode(mode);
    if (choice === "none" || choice === "apple") {
      setAutoWatchSyncEnabled(userId, false);
      setAutoEnabled(false);
    }
  }

  function chooseSource(mode) {
    if (!connectedReader || !userId || busy) return;
    setSourceMode(setStepSourceMode(userId, mode));
    setStatus({ state: "ready", message: `${stepSourceName(mode)} selected. Sync to update today's saved steps.` });
  }

  function toggleAuto(enabled) {
    if (!canSync || !userId) return;
    setAutoWatchSyncEnabled(userId, enabled);
    setAutoEnabled(enabled);
    setStatus({
      state: enabled ? "ready" : "disabled",
      message: enabled
        ? "Automatic step updates are on when you open or return to the Android app (up to once every 15 minutes). No background tracking."
        : "Automatic updates are off. You can still sync steps yourself.",
    });
  }

  async function check() {
    if (busy) return;
    setBusy(true);
    setOperation("check");
    try {
      setStatus(await inspectWatchConnection());
    } catch (error) {
      setStatus({ state: "error", message: error instanceof Error ? error.message : "Unable to check the connection." });
    } finally {
      setBusy(false);
      setOperation("");
    }
  }

  async function syncSteps() {
    if (!canSync || busy) return;
    setBusy(true);
    setOperation("sync");
    setStatus(null);
    try {
      const day = localDateKey();
      const record = await readWearableSteps(day, provider, { sourceMode });
      const saved = await CheckInRepository.saveStepsFromWatch(day, record);
      setEntry(readTodaysCheckIn());
      setStatus({
        state: "read-success",
        message: `${record.steps.toLocaleString()} steps saved for today${saved?.cloudSaved ? " and backed up to your account." : " on this device. Cloud backup is pending."}`,
      });
    } catch (error) {
      setStatus({
        state: "read-error",
        message: error instanceof Error ? error.message : "Couldn't read your watch steps. Your previous record hasn't changed.",
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
        <h1>Connect your watch</h1>
        <p>Choose your watch, then sync your daily steps. We'll handle the settings.</p>
      </section>

      <section className="form-card tf-watch-sync__section">
        <fieldset className="tf-watch-sync__watch-options">
          <legend>What watch do you have?</legend>
          <div className="tf-watch-sync__watch-grid">
            {watches.map((watch) => (
              <label key={watch.id} className={`tf-watch-sync__watch-choice${watchChoice === watch.id ? " is-selected" : ""}`}>
                <input type="radio" name="watch-choice" value={watch.id} checked={watchChoice === watch.id} onChange={() => chooseWatch(watch.id)} disabled={busy} />
                <span>{watch.name}</span>
                {watchChoice === watch.id && <CheckCircle2 size={18} aria-hidden="true" />}
              </label>
            ))}
          </div>
        </fieldset>
        {selectedWatch && (
          <div className="tf-watch-sync__setup" role="status">
            <strong>{watchChoice === "none" ? "Manual steps" : watchChoice === "apple" ? "iPhone required" : "One-time setup"}</strong>
            <p>{selectedWatch.help}</p>
            {canSync && <small>When prompted, allow TrackFit to read steps from Health Connect.</small>}
            {watchChoice === "samsung" && <small>Samsung Health can itself count phone steps. This setting filters by the Samsung Health app, not by watch hardware.</small>}
          </div>
        )}

        {watchChoice && watchChoice !== "none" && watchChoice !== "apple" && (
          connectedReader ? (
            <div className="tf-watch-sync__quick-actions">
              <button type="button" disabled={busy} onClick={syncSteps} className="tf-watch-sync__primary">
                <RefreshCw size={18} aria-hidden="true" />
                {busy && operation === "sync" ? "Reading steps..." : "Sync my steps"}
              </button>
              <label className="tf-watch-sync__auto">
                <input type="checkbox" checked={autoEnabled} disabled={!userId || busy} onChange={(event) => toggleAuto(event.target.checked)} />
                <span><strong>Update steps when I open TrackFit</strong>
                  <small>Optional. Up to once every 15 minutes while using the app.</small>
                </span>
              </label>
            </div>
          ) : (
            <div className="tf-watch-sync__notice" role="status">
              <AlertCircle size={20} aria-hidden="true" />
              <span>{nativeApp
                ? "This installed version can't access Health Connect. You'll need a compatible TrackFit Android build."
                : "Watch syncing works in the installed TrackFit Android app, not this browser. You can still enter steps manually here."}</span>
            </div>
          )
        )}

        {status && (
          <p role="status" className={status.state === "read-success" || status.state === "ready" ? "tf-watch-sync__success" : "tf-watch-sync__notice"}>
            {status.state === "read-success" || status.state === "ready" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            {status.message}
          </p>
        )}
        {!userId && <p className="tf-watch-sync__hint">Sign in to remember your watch choice on this device.</p>}
        <Link to="/checkin" className="tf-watch-sync__link">
          Enter steps manually <ExternalLink size={16} aria-hidden="true" />
        </Link>
      </section>

      <section className="tf-watch-sync__summary" aria-label="Today's saved steps">
        <Footprints size={27} aria-hidden="true" />
        <div><span>Today's steps</span><strong>{savedSteps}</strong><small>{entry ? source : "No steps recorded yet"}{syncedTime ? ` · synced ${syncedTime}` : ""}</small></div>
      </section>

      {connectedReader && (
        <details className="form-card tf-watch-sync__advanced">
          <summary><span>Step accuracy &amp; advanced settings</span><ChevronDown size={20} aria-hidden="true" /></summary>
          <p>Only open these settings if your step totals don't match.</p>
          <fieldset className="tf-watch-sync__source">
            <legend>Which steps should TrackFit count?</legend>
            <label>
              <input type="radio" name="step-source" value="samsung_health" checked={sourceMode === "samsung_health"} disabled={!userId || busy} onChange={() => chooseSource("samsung_health")} />
              <span><strong>Samsung Health only</strong><small>Records reported by Samsung Health, which may include phone steps.</small></span>
            </label>
            <label>
              <input type="radio" name="step-source" value="all" checked={sourceMode === "all"} disabled={!userId || busy} onChange={() => chooseSource("all")} />
              <span><strong>Combined Health Connect steps</strong><small>Eligible records from connected sources, using Health Connect's aggregation rules.</small></span>
            </label>
            <p>Changing the source won't overwrite today's total until the next sync.</p>
          </fieldset>
          <button type="button" disabled={busy} onClick={check} className="tf-watch-sync__secondary">
            {busy && operation === "check" ? "Checking..." : "Check connection permissions"}
          </button>
          <StepSourceAudit sourceMode={sourceMode} />
        </details>
      )}
    </main>
  );
}

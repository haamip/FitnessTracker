import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Footprints, RefreshCw, Watch } from "lucide-react";
import { localDateKey } from "../services/cardioSummary";
import { CheckInRepository } from "../services/repositories/trackfitDataLayer";
import { getWearableBridge, readWearableSteps } from "../services/wearableBridge";
import { isTrackFitNativeApp } from "../services/watchConnectionStatus";
import { signalTrackFitDataChange } from "../hooks/useTrackFitDataRefresh";
import "./NativeWatchSnapshot.css";

function getTodaysSteps() {
  return CheckInRepository.getAll().find((checkIn) => checkIn.date === localDateKey()) || null;
}

export default function NativeWatchSnapshot() {
  const [isNative] = useState(isTrackFitNativeApp);
  const [provider] = useState(getWearableBridge);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [entry, setEntry] = useState(getTodaysSteps);

  useEffect(() => {
    const update = () => setEntry(getTodaysSteps());
    window.addEventListener("trackfit:checkin-saved", update);
    window.addEventListener("trackfit:watch-auto-synced", update);
    return () => {
      window.removeEventListener("trackfit:checkin-saved", update);
      window.removeEventListener("trackfit:watch-auto-synced", update);
    };
  }, []);

  if (!isNative) return null;
  const supported = Boolean(provider);
  const numeric = entry?.steps == null ? null : Number(entry.steps);
  const steps = Number.isFinite(numeric) ? numeric.toLocaleString() : "—";

  async function sync() {
    if (busy || !provider) return;
    setBusy(true);
    setFeedback("");
    try {
      const day = localDateKey();
      const record = await readWearableSteps(day, provider);
      const result = await CheckInRepository.saveStepsFromWatch(day, record);
      setEntry(getTodaysSteps());
      signalTrackFitDataChange();
      setFeedback(result?.cloudSaved
        ? "Saved on your phone and backed up to your TrackFit account."
        : "Saved on your phone. Account backup is pending.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Watch steps couldn't be read. Your saved total is unchanged.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="tf-native-watch" aria-label="Galaxy Watch steps">
      <div className="tf-native-watch__heading">
        <div className="tf-native-watch__icon"><Watch size={21} aria-hidden="true" /></div>
        <div>
          <span>TRACKFIT NATIVE / HEALTH CONNECT</span>
          <h2>Watch &amp; steps</h2>
        </div>
        <Link to="/watch" aria-label="Open watch connection settings"><ArrowUpRight size={19} /></Link>
      </div>
      <div className="tf-native-watch__body">
        <div className="tf-native-watch__count">
          <Footprints size={20} aria-hidden="true" />
          <strong>{steps}</strong>
          <span>steps today{entry?.stepsSource === "health_connect" ? " · Health Connect" : entry ? " · Daily check-in" : ""}</span>
        </div>
        {supported ? (
          <button disabled={busy} type="button" onClick={sync} className="tf-native-watch__sync">
            <RefreshCw size={18} aria-hidden="true" /> {busy ? "Syncing..." : "Sync watch"}
          </button>
        ) : (
          <Link to="/watch" className="tf-native-watch__sync">Set up watch</Link>
        )}
      </div>
      {feedback && <p role="status" className="tf-native-watch__feedback">{feedback}</p>}
      <small>Reads your Health Connect total when you sync; automatic foreground sync is optional in Watch settings.</small>
    </section>
  );
}

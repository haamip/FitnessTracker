import { useState } from "react";
import { Activity, ArrowDownUp, CheckCircle2, Info, RotateCw } from "lucide-react";
import { localDateKey } from "../services/cardioSummary";
import { CheckInRepository } from "../services/repositories/trackfitDataLayer";
import { getWearableBridge } from "../services/wearableBridge";
import { inspectStepSources } from "../services/wearableDiagnostics";
import { isTrackFitNativeApp } from "../services/watchConnectionStatus";
import { compareStepTotals } from "../services/stepComparison";
import "./StepSourceAudit.css";

function labelTime(instant) {
  const date = new Date(instant);
  if (!instant || Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
  }).format(date);
}


/** Explicit, read-only diagnostics: no hidden permissions or accidental steps writes. */
export default function StepSourceAudit() {
  const [native] = useState(isTrackFitNativeApp);
  const [provider] = useState(getWearableBridge);
  const [comparison, setComparison] = useState(null);
  const [saved, setSaved] = useState(() => CheckInRepository.getAll().find((entry) => entry.date === localDateKey()) || null);
  const [checkedAt, setCheckedAt] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!native) return null;
  const capable = provider?.platform === "android" && typeof provider.bridge?.diagnoseTodaySteps === "function";
  const status = comparison ? compareStepTotals(saved?.steps, comparison.total) : null;

  async function inspect() {
    if (loading || !capable) return;
    setLoading(true);
    setComparison(null);
    setError("");
    try {
      const data = await inspectStepSources(localDateKey(), provider);
      setComparison(data);
      setCheckedAt(new Date().toISOString());
      setSaved(CheckInRepository.getAll().find((entry) => entry.date === data.date) || null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to inspect Steps. Try checking Health Connect permissions.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="form-card tf-steps-audit" aria-label="Compare Health Connect step sources">
      <div className="tf-steps-audit__heading"><ArrowDownUp size={21} aria-hidden="true"/><div><p className="eyebrow">Step accuracy</p><h2>Where are my steps coming from?</h2></div></div>
      <p>Compare TrackFit's last saved count with a fresh Health Connect reading, including which apps supplied the underlying records.</p>
      <button type="button" className="tf-steps-audit__button" onClick={inspect} disabled={!capable || loading}>
        <RotateCw size={18} aria-hidden="true"/>{loading ? "Checking sources..." : "Compare live step sources"}
      </button>
      {!capable && <p className="tf-steps-audit__hint">This feature requires the latest TrackFit Native Android build with Health Connect. It isn't available in a browser.</p>}
      {error && <p role="status" className="tf-steps-audit__error">{error}</p>}
      {comparison && (
        <div className="tf-steps-audit__results" role="status">
          <div className="tf-steps-audit__totals">
            <div><small>Saved in TrackFit</small><strong>{saved?.steps != null && Number.isFinite(Number(saved.steps)) ? Number(saved.steps).toLocaleString() : "—"}</strong></div>
            <div><small>Health Connect now</small><strong>{comparison.total.toLocaleString()}</strong></div>
          </div>
          {status?.kind === "match" && <p className="tf-steps-audit__match"><CheckCircle2 size={16} aria-hidden="true"/>Both readings match.</p>}
          {status?.kind === "more-now" && <p>Health Connect currently has <strong>{status.difference.toLocaleString()} more steps</strong> than TrackFit last saved. Tap <strong>Sync steps from watch</strong> above to save the latest deduplicated total.</p>}
          {status?.kind === "less-now" && <p>Health Connect currently shows <strong>{Math.abs(status.difference).toLocaleString()} fewer steps</strong> than TrackFit last saved. This can happen if the source priorities or records changed. Check the sources before syncing.</p>}
          {status?.kind === "no-saved" && <p>No steps saved in TrackFit today. Use Sync steps above to import the current Health Connect total.</p>}
          <small>Checked {labelTime(checkedAt)} · Day {comparison.date} ({comparison.timezone}){comparison.until ? ` · Data through ${labelTime(comparison.until)}` : ""}</small>
          <h3>Underlying step sources</h3>
          {comparison.sources.length ? (
            <ul>
              {comparison.sources.map((source, index) => (
                <li key={source.label + index}><span>{source.label}<small>{source.records} records</small></span><strong>{source.rawSteps.toLocaleString()}</strong></li>
              ))}
            </ul>
          ) : <p>No individual step records visible to this app for that period.</p>}
          {comparison.truncated && <p className="tf-steps-audit__hint">This diagnostic inspected only a subset of the individual records.</p>}
          <div className="tf-steps-audit__disclaimer"><Info size={17} aria-hidden="true" /><span>These per-app counts are raw records and can overlap. <strong>Do not add them together.</strong> TrackFit saves Health Connect's priority-adjusted total. “Samsung Health” means records written by Samsung Health, not necessarily watch-only steps.</span></div>
        </div>
      )}
      <div className="tf-steps-audit__footer"><Activity size={17} aria-hidden="true" />This is a read-only check. Nothing is saved until you choose Sync.</div>
    </section>
  );
}

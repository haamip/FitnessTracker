import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CalendarDays, CloudUpload, History, RotateCcw } from "lucide-react";
import { HistoryRepository } from "../services/repositories/trackfitDataLayer";
import useTrackFitDataRefresh from "../hooks/useTrackFitDataRefresh";
import "./TrackFitScreens.css";
import "./TrainHome.css";
import "./WorkoutHistory.css";

const PAGE_SIZE = 10;
const dateLabel = value => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Date unavailable"
    : parsed.toLocaleDateString("en-AU",{day:"numeric",month:"short",year:"numeric"});
};
export default function WorkoutHistory() {
  const [revision] = useTrackFitDataRefresh();
  const [limit,setLimit] = useState(PAGE_SIZE);
  const [legacyCount,setLegacyCount] = useState(() => HistoryRepository.getLegacyCount());
  const [pending,setPending] = useState(() => HistoryRepository.getPendingIds().length);
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState("");
  const history = useMemo(() => { void revision; return HistoryRepository.getAll(); },[revision,notice]);
  function restoreHistory() {
    if (!window.confirm("Only restore older workout records if they belong to your signed-in account. Continue?")) return;
    const count=HistoryRepository.importLegacyForCurrentUser();
    setLegacyCount(HistoryRepository.getLegacyCount());
    setPending(HistoryRepository.getPendingIds().length);
    setNotice(`${count} older workout record${count===1?"":"s"} restored to this account on this device.`);
  }
  async function retry() {
    if(busy)return;
    setBusy(true);
    try{await HistoryRepository.retryPending();setPending(HistoryRepository.getPendingIds().length);setNotice("Cloud backup checked.");}
    catch(error){setNotice(error instanceof Error?error.message:"Could not sync right now.");}
    finally{setBusy(false);}
  }
  return (
    <main className="screen tf-train-home" data-testid="trackfit-workout-history">
      <section className="v4-workout-hero">
        <Link to="/workouts" aria-label="Back to Train"><ArrowLeft size={21}/></Link>
        <div><p className="eyebrow">Training records</p><h1>Workout history</h1><p>Your completed sessions, separate from your active routines.</p></div>
      </section>
      <section className="tf-history-summary"><History size={22}/><strong>{history.length} completed</strong><span>All recorded sessions</span></section>
      {pending > 0 && <section className="tf-history-alert">
        <CloudUpload size={19}/><span>{pending} completed workout{pending===1?"":"s"} waiting for cloud backup.</span>
        <button disabled={busy} onClick={retry} type="button">{busy?"Checking...":"Retry sync"}</button>
      </section>}
      {legacyCount > 0 && <details className="tf-history-legacy">
        <summary><RotateCcw size={17}/> {legacyCount} older workout record{legacyCount===1?"":"s"} found on this phone</summary>
        <p>These records predate account-specific syncing. Only restore them if they're yours.</p>
        <button type="button" onClick={restoreHistory}>Restore my old workout history</button>
      </details>}
      {notice && <p role="status">{notice}</p>}
      {history.length === 0 ? (
        <section className="form-card"><h2>No completed sessions yet</h2><p>Finish a workout and it will appear here.</p><Link to="/workouts/library">Choose a workout <ArrowRight size={16}/></Link></section>
      ) : (
        <section className="tf-history-list" aria-label="Completed workouts">
          {history.slice(0,limit).map(item=><Link key={item.id} className="tf-history-line" to={`/workouts/history/${encodeURIComponent(item.id)}`}>
            <span className="tf-history-line-icon"><CalendarDays size={19}/></span>
            <span className="tf-history-line-details"><strong>{item.title||"Completed workout"}</strong><small>{dateLabel(item.completedAt)} · {Math.max(0,Math.round(Number(item.seconds)||0)/60)} min · {Math.round(Number(item.volume)||0).toLocaleString()} kg</small></span>
            <ArrowRight size={17}/>
          </Link>)}
          {limit<history.length && <button type="button" className="tf-history-more" onClick={()=>setLimit(x=>x+PAGE_SIZE)}>Show 10 more sessions ({history.length-limit} remaining)</button>}
        </section>
      )}
    </main>
  );
}

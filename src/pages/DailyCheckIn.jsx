import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Footprints, HeartPulse, Save, Watch } from "lucide-react";
import { completeDailyCheckIn } from "../features/gamification/gamification";
import { CheckInRepository } from "../services/repositories/trackfitDataLayer";
import { getWearableBridge, readWearableSteps } from "../services/wearableBridge";
import { inspectWatchConnection, isTrackFitNativeApp } from "../services/watchConnectionStatus";
import { inspectStepSources } from "../services/wearableDiagnostics";
import { getCurrentStepSourceMode, stepSourceName } from "../services/stepSourcePreference";
import "./TrackFitScreens.css";

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
}
function initialValues() {
  const today = todayKey();
  const existing = CheckInRepository.getAll().find((x)=>x.date===today) || {};
  const activity = existing.activityType || (existing.trainedToday === true ? "workout" : "rest");
  return {
    steps: existing.steps ?? "",
    stepsSource: existing.stepsSource || "manual",
    stepsSyncedAt: existing.stepsSyncedAt || "",
    mood: existing.mood || "Okay",
    activityType: activity,
    weightKg: existing.weightKg ?? "",
    sleepHours: existing.sleepHours ?? "",
    waterL: existing.waterL ?? "",
    proteinG: existing.proteinG ?? "",
    energy: existing.energy ?? "",
    bodyFeel: existing.bodyFeel || "Mild",
    trainingNote: existing.trainingNote || "",
  };
}
const MODES = [
  ["workout", "Workout"],
  ["cardio", "Cardio"],
  ["both", "Both"],
  ["rest", "Rest"],
];
const FEELINGS = ["Great", "Good", "Okay", "Flat", "Rough"];

export default function DailyCheckIn() {
  const [form,setForm] = useState(initialValues);
  const [showDetails,setShowDetails] = useState(false);
  const [message,setMessage] = useState("");
  const [saving,setSaving] = useState(false);
  const [lastSaved,setLastSaved] = useState(() => CheckInRepository.getAll().find(x => x.date === todayKey()) || null);
  const [olderEntries, setOlderEntries] = useState(() => CheckInRepository.getLegacyCount());
  function importOlderEntries() {
    const count = CheckInRepository.importLegacyForCurrentUser();
    setOlderEntries(0);
    setForm(initialValues());
    setMessage(`${count} older check-in${count === 1 ? "" : "s"} imported. Cloud sync will retry if you're offline.`);
  }
  const [watchProvider] = useState(getWearableBridge);
  const watchAvailable = Boolean(watchProvider);
  const [nativeApp] = useState(isTrackFitNativeApp);
  const [connection, setConnection] = useState(null);
  const [checkingConnection, setCheckingConnection] = useState(false);
  async function checkConnection() {
    setCheckingConnection(true);
    const result = await inspectWatchConnection();
    setConnection(result);
    setCheckingConnection(false);
  }
  const [watchLoading, setWatchLoading] = useState(false);
  const [sourceComparison, setSourceComparison] = useState(null);
  const [sourceChecking, setSourceChecking] = useState(false);
  const [sourceError, setSourceError] = useState("");
  async function checkStepSources() {
    if (sourceChecking) return;
    setSourceChecking(true);
    setSourceError("");
    setSourceComparison(null);
    try {
      setSourceComparison(await inspectStepSources(todayKey()));
    } catch (error) {
      setSourceError(error instanceof Error ? error.message : "Unable to compare health data sources.");
    } finally {
      setSourceChecking(false);
    }
  }
  async function syncWatchSteps() {
    if (watchLoading) return;
    setWatchLoading(true);
    setMessage("");
    setConnection(null);
    try {
      const day = todayKey();
      const sourceMode = await getCurrentStepSourceMode();
      const record = await readWearableSteps(day, undefined, { sourceMode });
      const saved = await CheckInRepository.saveStepsFromWatch(day, record);
      setForm((current)=>({ ...current, ...record }));
      const count = record.steps.toLocaleString();
      const backup = saved?.cloudSaved
        ? "and backed up to your TrackFit account"
        : "on this phone; cloud backup is pending and will retry when you sign in again";
      setConnection({ state: "read-success", message: `${record.stepsSource === "apple_health" ? "Apple Health" : stepSourceName(record.stepsMode)} returned ${count} steps today. Saved ${backup}.` });
      setMessage(`${count} steps saved in TrackFit. You can finish the rest of your check-in below whenever you like.`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Watch steps could not be read.";
      setConnection({ state: "read-error", message: detail });
      setMessage("Steps have not been imported. Your previous daily entry has not been replaced.");
    } finally {
      setWatchLoading(false);
    }
  }
  function field(name,value){setForm((current)=>({...current,[name]:value}));setMessage("");}
  async function save(event){
    event.preventDefault();
    if (saving) return;
    const today = todayKey();
    const stepsText = String(form.steps).trim();
    const steps = stepsText === "" ? null : Number(stepsText);
    if (steps !== null && (!Number.isSafeInteger(steps) || steps < 0 || steps > 150000)) {
      setMessage("Steps must be a whole number between 0 and 150,000.");
      return;
    }
    const records = CheckInRepository.getAll();
    const existing = records.find((x)=>x.date===today) || {};
    const update = {
      ...existing,
      id: existing.id || `checkin-${crypto.randomUUID()}`,
      date: today,
      steps,
      stepsSource: form.stepsSource || "manual",
      ...(["health_connect", "apple_health"].includes(form.stepsSource) ? { stepsSyncedAt: form.stepsSyncedAt } : { stepsSyncedAt: null }),
      mood: form.mood,
      activityType: form.activityType,
      trainedToday: ["workout","both"].includes(form.activityType),
      trainingNote: form.trainingNote.trim(),
    };
    // Optional input fields should remain absent if the user didn't fill them in.
    ["weightKg","sleepHours","waterL","proteinG","energy"].forEach((key)=>{
      const raw=String(form[key]).trim();
      if(raw) update[key]=Number(raw);
      else delete update[key];
    });
    update.bodyFeel=form.bodyFeel;
    setSaving(true);
    try {
      // Local write happens synchronously; don't leave the user staring at a
      // button while an unreliable network request is in flight.
      const backup = CheckInRepository.saveAll([update,...records.filter((x)=>x.date!==today)]);
      setLastSaved(update);
      completeDailyCheckIn();
      setMessage("Today's check-in saved on this phone. Backing up to your account...");
      const result = await backup;
      setMessage(result?.cloudSaved
        ? "Today's check-in saved and backed up to your account. Good mahi."
        : "Today's check-in saved on your phone. Cloud backup is pending and will retry.");
    } catch (error) {
      setMessage(error instanceof Error
        ? `Could not save today's check-in: ${error.message}`
        : "Couldn't save your check-in on this device. Try again.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <motion.form className="screen checkin-v4" onSubmit={save} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
      <section className="v4-checkin-hero">
        <div><p className="eyebrow">Daily check-in</p><h1>60-second check-in</h1><p>Steps, how you feel, workout or rest. Done.</p></div>
      </section>
      <section className="v4-workout-list">
        <div className="v4-section-heading"><div><p className="eyebrow">Movement</p><h2><Footprints size={18} /> Steps today</h2></div><Link to="/watch" style={{fontWeight:850,color:"#35503a",textDecoration:"underline"}}>Watch & Steps</Link></div>
        <label className="form-card">
          Total steps so far
          <input aria-label="Daily steps" type="number" inputMode="numeric" min="0" max="150000" step="1" placeholder="e.g. 8500" value={form.steps ?? ""} onChange={(e)=>setForm((current)=>({...current,steps:e.target.value,stepsSource:"manual",stepsSyncedAt:""}))} style={{width:"100%",padding:12,marginTop:8,borderRadius:12}} />
        </label>
        {watchAvailable && (
          <button type="button" disabled={watchLoading} onClick={syncWatchSteps}>
            <Watch size={18} /> {watchLoading ? "Reading your steps..." : "Sync steps from phone or watch"}
          </button>
        )}
        {nativeApp && (
          <button type="button" disabled={checkingConnection} onClick={checkConnection}>
            {checkingConnection ? "Checking connection..." : "Check watch connection"}
          </button>
        )}
        {nativeApp && watchProvider?.platform === "android" && (
          <button type="button" disabled={sourceChecking || watchLoading} onClick={checkStepSources}>
            {sourceChecking ? "Comparing sources..." : "Compare step sources"}
          </button>
        )}
        {sourceError && <p role="status">{sourceError}</p>}
        {sourceComparison && (
          <div className="form-card" role="status" style={{ display:"grid", gap:7, marginTop:8 }}>
            <strong>Health Connect API: {sourceComparison.total.toLocaleString()} steps</strong>
            <small>Day: {sourceComparison.date} ({sourceComparison.timezone}). Compared through {sourceComparison.until}.</small>
            {sourceComparison.sources.length ? sourceComparison.sources.map((source, i) => (
              <span key={source.label + i}>
                {source.label}: {source.rawSteps.toLocaleString()} raw steps across {source.records} records
              </span>
            )) : <span>No individual step records found for this time window.</span>}
            <small>Raw source counts can overlap. TrackFit uses the Health Connect priority-adjusted total, not the sum of these sources.{sourceComparison.truncated ? " Only a subset of records was inspected." : ""}</small>
          </div>
        )}
        {connection && (
          <p role="status" style={{ margin: "8px 0", fontSize: 13 }}>
            <strong>{connection.state === "ready" ? "Ready" : connection.state === "read-success" ? "Steps saved" : "Connection check"}:</strong> {connection.message}
          </p>
        )}
        <small>
          {["health_connect","apple_health"].includes(form.stepsSource) ? "Imported steps are saved immediately; your other check-in answers can be saved separately." : "Enter total daily steps from your watch or phone."}
          {" "}Do not add cardio steps to your daily total again.
        </small>
      </section>
      <section className="v4-workout-list">
        <div className="v4-section-heading"><div><p className="eyebrow">Recovery</p><h2><HeartPulse size={18} /> How are you feeling?</h2></div></div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}} role="group" aria-label="How you feel">
          {FEELINGS.map((feeling)=><button type="button" key={feeling} aria-pressed={form.mood===feeling} onClick={()=>field("mood",feeling)} style={{padding:"10px 12px",borderRadius:14,border:form.mood===feeling?"2px solid currentColor":"1px solid #777",fontWeight:form.mood===feeling?800:400}}>{feeling}</button>)}
        </div>
      </section>
      <section className="v4-workout-list">
        <div className="v4-section-heading"><div><p className="eyebrow">Training</p><h2><Activity size={18} /> Today was...</h2></div></div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}} role="group" aria-label="Activity today">
          {MODES.map(([value,label])=><button type="button" key={value} aria-pressed={form.activityType===value} onClick={()=>field("activityType",value)} style={{padding:"10px 14px",borderRadius:14,border:form.activityType===value?"2px solid currentColor":"1px solid #777",fontWeight:form.activityType===value?800:400}}>{label}</button>)}
        </div>
      </section>
      <section className="v4-workout-list">
        <button type="button" aria-expanded={showDetails} onClick={()=>setShowDetails((state)=>!state)}>{showDetails?"Hide optional details":"More details (optional)"}</button>
        {showDetails && <div className="form-card form-grid">
          {[
            ["weightKg","Weight (kg)"],["sleepHours","Sleep (hours)"],["waterL","Water (litres)"],["proteinG","Protein (grams)"],["energy","Energy (1–10)"],
          ].map(([key,label])=><label key={key}>{label}<input type="number" min={key==="energy"?1:0} max={key==="energy"?10:undefined} step={key==="proteinG"||key==="energy"?"1":"0.1"} inputMode="decimal" value={form[key]} onChange={(e)=>field(key,e.target.value)} /></label>)}
          <label>Body soreness
            <select value={form.bodyFeel} onChange={(e)=>field("bodyFeel",e.target.value)}>
              {["Low","Mild","Moderate","High"].map((x)=><option key={x}>{x}</option>)}
            </select>
          </label>
          <label>Notes
            <textarea maxLength={500} rows={2} value={form.trainingNote} onChange={(e)=>field("trainingNote",e.target.value)} placeholder="Anything you'd like your coach to know" />
          </label>
        </div>}
      </section>
      {olderEntries > 0 && (
        <section className="form-card" style={{ display: "grid", gap: 10 }}>
          <strong>Found {olderEntries} older check-ins on this phone</strong>
          <p>These were saved before account-specific storage. Only import them if they're yours. This won't import anyone else's cloud records.</p>
          <button type="button" onClick={importOlderEntries}>Import my older check-ins</button>
        </section>
      )}
      {lastSaved && (
        <section className="form-card" aria-label="Today's check-in status" style={{ display:"grid", gap:6 }}>
          <strong>Today's check-in is recorded</strong>
          <p style={{ margin:0, lineHeight:1.6 }}>Feeling: {lastSaved.mood || "Not selected"} · {lastSaved.activityType === "both" ? "Workout and cardio" : lastSaved.activityType || "Rest"}
            {lastSaved.steps !== null && lastSaved.steps !== "" && lastSaved.steps !== undefined ? ` · ${Number(lastSaved.steps).toLocaleString()} steps` : ""}</p>
          <small>You can change your answers and save again at any time today.</small>
        </section>
      )}
      {message && <p role="status" aria-live="polite" style={{ fontWeight:700, lineHeight:1.55 }}>{message}</p>}
      <button className="v4-save-checkin" type="submit" disabled={saving}><Save size={18} /> {saving ? "Saving and backing up..." : lastSaved ? "Update today's check-in" : "Save daily check-in"}</button>
      <p style={{marginTop:16,fontSize:13}}><Watch size={15} /> {watchAvailable
        ? "TrackFit only reads steps when you ask and give permission. Your manual entry still works."
        : "Copy your watch steps here for now. Automatic importing needs the native TrackFit app, not the website."}</p>
      <p><Link to="/coach/weekly">Weekly coach review</Link></p>
    </motion.form>
  );
}

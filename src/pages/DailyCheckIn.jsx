import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Footprints, HeartPulse, Save, Watch } from "lucide-react";
import { completeDailyCheckIn } from "../features/gamification/gamification";
import { CheckInRepository } from "../services/repositories/trackfitDataLayer";
import { getHealthConnectBridge, readGalaxyDailySteps } from "../services/healthConnectBridge";
import "./TrackFitScreens.css";

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
}
const today = todayKey();

function initialValues() {
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
  const [watchAvailable] = useState(() => Boolean(getHealthConnectBridge()));
  const [watchLoading, setWatchLoading] = useState(false);
  async function syncWatchSteps() {
    if (watchLoading) return;
    setWatchLoading(true);
    setMessage("");
    try {
      const record = await readGalaxyDailySteps(today);
      setForm((current)=>({ ...current, ...record }));
      setMessage("Steps loaded from Health Connect. Tap Save daily check-in to keep them.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Watch steps could not be read.");
    } finally {
      setWatchLoading(false);
    }
  }
  function field(name,value){setForm((current)=>({...current,[name]:value}));setMessage("");}
  function save(event){
    event.preventDefault();
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
      ...(form.stepsSource === "health_connect" ? { stepsSyncedAt: form.stepsSyncedAt } : { stepsSyncedAt: null }),
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
    try {
      CheckInRepository.saveAll([update,...records.filter((x)=>x.date!==today)]);
      completeDailyCheckIn();
      setMessage("Check-in saved. Good mahi.");
    }catch{
      setMessage("Couldn't save your check-in on this device. Try again.");
    }
  }
  return (
    <motion.form className="screen checkin-v4" onSubmit={save} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
      <section className="v4-checkin-hero">
        <div><p className="eyebrow">Daily check-in</p><h1>60-second check-in</h1><p>Steps, how you feel, workout or rest. Done.</p></div>
      </section>
      <section className="v4-workout-list">
        <div className="v4-section-heading"><div><p className="eyebrow">Movement</p><h2><Footprints size={18} /> Steps today</h2></div></div>
        <label className="form-card">
          Total steps so far
          <input aria-label="Daily steps" type="number" inputMode="numeric" min="0" max="150000" step="1" placeholder="e.g. 8500" value={form.steps ?? ""} onChange={(e)=>setForm((current)=>({...current,steps:e.target.value,stepsSource:"manual",stepsSyncedAt:""}))} style={{width:"100%",padding:12,marginTop:8,borderRadius:12}} />
        </label>
        {watchAvailable && (
          <button type="button" disabled={watchLoading} onClick={syncWatchSteps}>
            <Watch size={18} /> {watchLoading ? "Reading Health Connect..." : "Use Galaxy Watch steps"}
          </button>
        )}
        <small>
          {form.stepsSource === "health_connect" ? "Steps retrieved from Health Connect — save your check-in to keep them." : "Enter total daily steps from your watch or phone."}
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
      {message && <p role="status">{message}</p>}
      <button className="v4-save-checkin" type="submit"><Save size={18} /> Save daily check-in</button>
      <p style={{marginTop:16,fontSize:13}}><Watch size={15} /> {watchAvailable
        ? "Health Connect only reads steps when you tap the button and grant permission. Your manual entry still works."
        : "Watch steps can be copied here for now. Health Connect requires the future Android TrackFit app, not the website."}</p>
      <p><Link to="/coach/weekly">Weekly coach review</Link></p>
    </motion.form>
  );
}

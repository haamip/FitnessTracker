import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Camera, Trash2 } from "lucide-react";
import { CardioRepository, CheckInRepository, HistoryRepository, NutritionRepository } from "../services/repositories/trackfitDataLayer";
import { buildWeeklyFeedback, getWeekStart, getWeeklyFacts, WeeklyReviewRepository } from "../services/weeklyCoachReview";
import { deleteWeeklyPhoto, getWeeklyPhoto, putWeeklyPhoto } from "../services/weeklyPhotos";
import { requestTrackFitCoach } from "../services/ai/secureCoachClient";
import { Sparkles } from "lucide-react";
import "./TrackFitScreens.css";

const questions = [
  { key: "nutrition", label: "How was your nutrition?", options: [["on-track","On track"],["mixed","Up & down"],["struggled","Struggled"]] },
  { key: "steps", label: "How did your daily steps go?", options: [["great","Good"],["mixed","Some days"],["less","Not much"]] },
  { key: "cardio", label: "How did cardio go?", options: [["good","Good"],["mixed","Some"],["less","Less than planned"]] },
  { key: "progression", label: "How is strength progressing?", options: [["improved","Improving"],["steady","Steady"],["stalled","Stalled"]] },
  { key: "recovery", label: "How are you feeling overall?", options: [["good","Good"],["okay","Okay"],["rough","Run down"]] },
];
const angles = ["front", "side", "back"];
const EMPTY_ANSWERS = { nutrition:"",steps:"",cardio:"",progression:"",recovery:"",note:"" };
function shiftWeek(week, offset) {
  const date = new Date(week + "T12:00:00");
  date.setDate(date.getDate() + offset * 7);
  return getWeekStart(date);
}

function PhotoSlot({ weekStart, angle, refresh, onPhotoChange }) {
  const [image, setImage] = useState("");
  const [previousImage, setPreviousImage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const urls = [];
    async function load() {
      try {
        const [current, previous] = await Promise.all([
          getWeeklyPhoto(weekStart, angle),
          getWeeklyPhoto(shiftWeek(weekStart, -1), angle),
        ]);
        if (!active) return;
        const currentUrl = current ? URL.createObjectURL(current.image) : "";
        const previousUrl = previous ? URL.createObjectURL(previous.image) : "";
        if (currentUrl) urls.push(currentUrl);
        if (previousUrl) urls.push(previousUrl);
        setImage(currentUrl);
        setPreviousImage(previousUrl);
      } catch {
        if (active) setError("Photo storage is unavailable on this device.");
      }
    }
    void load();
    return () => { active = false; urls.forEach((url) => URL.revokeObjectURL(url)); };
  }, [weekStart, angle, refresh]);

  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      await putWeeklyPhoto(weekStart, angle, file);
      onPhotoChange();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Photo could not be saved.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }
  async function remove() {
    setBusy(true);
    try {
      await deleteWeeklyPhoto(weekStart, angle);
      onPhotoChange();
    } catch {
      setError("Photo could not be deleted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="form-card" style={{ display: "grid", gap: 10 }}>
      <strong style={{ textTransform: "capitalize" }}>{angle}</strong>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
        <div><small>This week</small>{image ? <img src={image} alt={`${angle} progress this week`} style={{ width:"100%", aspectRatio:"3 / 4", objectFit:"cover",borderRadius:10 }} /> : <p>No photo</p>}</div>
        <div><small>Last week</small>{previousImage ? <img src={previousImage} alt={`${angle} progress last week`} style={{ width:"100%", aspectRatio:"3 / 4", objectFit:"cover",borderRadius:10 }} /> : <p>No photo</p>}</div>
      </div>
      <label style={{ display:"inline-flex",alignItems:"center",gap:8,cursor:"pointer" }}>
        <Camera size={18} /> {busy ? "Saving..." : image ? "Replace photo" : "Add photo"}
        <input aria-label={`Upload ${angle} photo`} type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} disabled={busy} hidden />
      </label>
      {image && <button type="button" disabled={busy} onClick={remove}><Trash2 size={15} /> Delete photo</button>}
      {error && <small role="alert">{error}</small>}
    </article>
  );
}

export default function WeeklyCoachReview() {
  const currentWeek = getWeekStart();
  const [week, setWeek] = useState(currentWeek);
  const [answers, setAnswers] = useState(() => ({ ...EMPTY_ANSWERS, ...(WeeklyReviewRepository.getByWeek(currentWeek)?.answers || {}) }));
  const [saved, setSaved] = useState(() => Boolean(WeeklyReviewRepository.getByWeek(currentWeek)));
  const [photoRevision, setPhotoRevision] = useState(0);
  const [aiFeedback, setAIFeedback] = useState(null);
  const [aiError, setAIError] = useState("");
  const [aiBusy, setAIBusy] = useState(false);
  const facts = useMemo(() => getWeeklyFacts({
    checkIns: CheckInRepository.getAll(),
    workouts: HistoryRepository.getAll(),
    cardio: CardioRepository.getAll(),
    meals: NutritionRepository.getAll(),
  }, week), [week]);
  const feedback = useMemo(() => buildWeeklyFeedback(facts, answers), [facts, answers]);
  const answered = questions.every((q) => answers[q.key]);
  function setWeekAndAnswers(newWeek) {
    const review = WeeklyReviewRepository.getByWeek(newWeek);
    setWeek(newWeek);
    setAnswers({ ...EMPTY_ANSWERS, ...(review?.answers || {}) });
    setSaved(Boolean(review));
    setAIFeedback(null);
    setAIError("");
  }
  function save() {
    if (!answered) return;
    WeeklyReviewRepository.save({ weekStart: week, answers });
    setSaved(true);
    setAIFeedback(null);
    setAIError("");
  }
  async function generateWeeklyAdvice() {
    if (aiBusy || !saved || week !== currentWeek) return;
    setAIBusy(true);
    setAIError("");
    try { setAIFeedback(await requestTrackFitCoach("weekly", { answers })); }
    catch (error) { setAIError(error instanceof Error ? error.message : "AI Coach is unavailable."); }
    finally { setAIBusy(false); }
  }
  return (
    <main className="screen workouts-v4">
      <section className="v4-workout-hero">
        <Link to="/coach/intelligence" aria-label="Back to coach"><ArrowLeft size={22} /></Link>
        <div><p className="eyebrow">Your coach</p><h1>Weekly check-in</h1>
          <p>A few answers, real training data, and one clear direction for next week.</p></div>
      </section>
      <section className="form-card" style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:10 }}>
        <button type="button" aria-label="Previous week" onClick={() => setWeekAndAnswers(shiftWeek(week,-1))}><ChevronLeft size={22}/></button>
        <strong>Week of {new Date(week+"T12:00:00").toLocaleDateString("en-AU",{day:"numeric",month:"short",year:"numeric"})}</strong>
        <button type="button" aria-label="Next week" disabled={week>=currentWeek} onClick={() => setWeekAndAnswers(shiftWeek(week,1))}><ChevronRight size={22}/></button>
      </section>
      <section className="v4-workout-list">
        <div className="v4-section-heading"><div><p className="eyebrow">Your logs</p><h2>This week's numbers</h2></div></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:10}}>
          {[
            ["Strength",`${facts.workouts} workouts`],
            ["Cardio",`${facts.cardioMinutes} minutes`],
            ["Steps",facts.averageSteps === null ? "Not logged" : `${facts.averageSteps.toLocaleString()} / logged day`],
            ["Check-ins",`${facts.checkInDays} days`],
          ].map(([label,value])=><article className="form-card" key={label}><small>{label}</small><strong style={{display:"block"}}>{value}</strong></article>)}
        </div>
        <small>Daily steps are total steps for each logged day. Cardio steps are not added again.</small>
      </section>
      <section className="v4-workout-list">
        <div className="v4-section-heading"><div><p className="eyebrow">Your answers</p><h2>How was your week?</h2></div></div>
        {questions.map((question)=>(
          <fieldset className="form-card" key={question.key} style={{border:0,margin:0,display:"grid",gap:10}}>
            <legend style={{fontWeight:700,marginBottom:10}}>{question.label}</legend>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {question.options.map(([value,label])=><label key={value} style={{display:"inline-flex",gap:6,alignItems:"center",padding:"8px 10px",border:"1px solid #777",borderRadius:14}}>
                <input type="radio" name={question.key} checked={answers[question.key]===value} onChange={() => {setAnswers((x)=>({...x,[question.key]:value}));setSaved(false);}} />
                {label}
              </label>)}
            </div>
          </fieldset>
        ))}
        <label className="form-card">Anything else for your coach? (optional)
          <textarea rows={3} maxLength={800} value={answers.note} onChange={(event)=>{setAnswers((x)=>({...x,note:event.target.value}));setSaved(false);}} placeholder="Wins, challenges, injuries, what you'd like to change..." style={{width:"100%",marginTop:8}} />
        </label>
        <button type="button" disabled={!answered} onClick={save} className="v4-save-checkin">{saved ? "Saved — update review" : "Save my weekly check-in"}</button>
        {!answered && <small>Answer the five quick questions to save your weekly review.</small>}
      </section>
      {saved && (
        <section className="v4-workout-list" aria-live="polite">
          <div className="v4-section-heading"><div><p className="eyebrow">Coach's response</p><h2>{feedback.heading}</h2></div></div>
          <div className="form-card"><strong>From your logs</strong><ul>{feedback.evidence.map((line)=><li key={line}>{line}</li>)}</ul></div>
          <div className="form-card"><strong>Focus for next week</strong><ol>{feedback.nextSteps.map((line)=><li key={line}>{line}</li>)}</ol></div>
          <small>{feedback.note} Coaching suggestions are estimates, not medical advice.</small>
        </section>
      )}
      {saved && week === currentWeek && (
        <section className="form-card" style={{display:"grid",gap:12}} aria-label="AI weekly review">
          <div style={{display:"flex",alignItems:"center",gap:8}}><Sparkles size={20}/><strong>Your AI weekly review</strong></div>
          <p style={{margin:0,fontSize:13}}>Get an AI summary of your saved answers and recent synced account logs. Your progress pictures stay on your device.</p>
          <button type="button" disabled={aiBusy} onClick={generateWeeklyAdvice} className="v4-save-checkin">
            {aiBusy ? "Reviewing your week..." : aiFeedback ? "Regenerate weekly advice" : "Generate AI weekly feedback"}
          </button>
          {aiFeedback && <div role="status" style={{display:"grid",gap:8}}>
            <strong>{aiFeedback.headline}</strong><p style={{margin:0}}>{aiFeedback.summary}</p>
            {aiFeedback.actions.length > 0 && <ul>{aiFeedback.actions.map((item,i)=><li key={i}>{item}</li>)}</ul>}
            <small>AI-generated from synced account records only. Unsynced activity may not appear.</small>
          </div>}
          {aiError && <p role="alert" style={{margin:0,color:"#8a411f"}}>{aiError} Your standard weekly feedback above is still available.</p>}
        </section>
      )}
      <section className="v4-workout-list">
        <div className="v4-section-heading"><div><p className="eyebrow">Progress pictures</p><h2>Compare week to week</h2></div></div>
        <p>Optional front, side and back photos. Saved privately on this device only. They will not sync across devices yet. Clearing browser data can delete them.</p>
        {angles.map((angle)=><PhotoSlot key={angle} angle={angle} weekStart={week} refresh={photoRevision} onPhotoChange={()=>setPhotoRevision((n)=>n+1)} />)}
      </section>
      <p style={{marginTop:20}}><Link to="/checkin">Daily check-in</Link> · <Link to="/workouts">Workouts</Link> · <Link to="/cardio">Cardio</Link></p>
    </main>
  );
}

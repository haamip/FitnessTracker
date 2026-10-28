import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Camera, Trash2 } from "lucide-react";
import { CardioRepository, CheckInRepository, HistoryRepository, NutritionRepository } from "../services/repositories/trackfitDataLayer";
import { buildWeeklyFeedback, getWeekStart, getWeeklyFacts, WeeklyReviewRepository } from "../services/weeklyCoachReview";
import { WeeklyReviewCloudRepository } from "../services/weeklyReviewCloudRepository";
import { deleteWeeklyPhoto, getWeeklyPhoto, putWeeklyPhoto } from "../services/weeklyPhotos";
import { requestTrackFitCoach } from "../services/ai/secureCoachClient";
import { Sparkles } from "lucide-react";
import "./TrackFitScreens.css";
import "./WeeklyCoachReview.css";

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
    <article className="form-card tf-weekly-photo">
      <h3 className="tf-weekly-photo__title">{angle}</h3>
      <div className="tf-weekly-photo__grid">
        {[["This week", image], ["Last week", previousImage]].map(([heading, url]) => (
          <div className="tf-weekly-photo__column" key={heading}>
            <span className="tf-weekly-photo__caption">{heading}</span>
            <div className="tf-weekly-photo__preview">
              {url
                ? <img src={url} alt={`${angle} progress ${heading.toLowerCase()}`} />
                : <div className="tf-weekly-photo__empty">
                    <Camera aria-hidden="true" size={23} />
                    <span>No photo yet</span>
                  </div>}
            </div>
          </div>
        ))}
      </div>
      <div className="tf-weekly-photo__actions">
        <label className={`tf-weekly-photo__upload${busy ? " is-busy" : ""}`}>
          <Camera size={18} aria-hidden="true" />
          <span>{busy ? "Saving photo..." : image ? "Replace photo" : "Add photo"}</span>
          <input type="file" aria-label={`Upload ${angle} progress photo`}
            accept="image/jpeg,image/png,image/webp"
            onChange={upload} disabled={busy} />
        </label>
        {image && (
          <button className="tf-weekly-photo__delete" type="button" disabled={busy} onClick={remove}>
            <Trash2 size={16} aria-hidden="true" /> Delete photo
          </button>
        )}
      </div>
      {error && <p className="tf-weekly-photo__error" role="alert">{error}</p>}
    </article>
  );
}

export default function WeeklyCoachReview() {
  const currentWeek = getWeekStart();
  const [week, setWeek] = useState(currentWeek);
  const [answers, setAnswers] = useState(() => ({ ...EMPTY_ANSWERS, ...(WeeklyReviewRepository.getByWeek(currentWeek)?.answers || {}) }));
  const [saved, setSaved] = useState(() => Boolean(WeeklyReviewRepository.getByWeek(currentWeek)));
  const [backupPending, setBackupPending] = useState(() => WeeklyReviewCloudRepository.getPendingCount());
  const [backupMessage, setBackupMessage] = useState("");
  const [backupBusy, setBackupBusy] = useState(false);
  const [legacyReviewCount, setLegacyReviewCount] = useState(() => WeeklyReviewRepository.getLegacyCount());
  const dirtyRef = useRef(false);
  const weekRef = useRef(currentWeek);
  const [photoRevision, setPhotoRevision] = useState(0);
  const [aiFeedback, setAIFeedback] = useState(null);
  const [aiError, setAIError] = useState("");
  const [aiBusy, setAIBusy] = useState(false);
  useEffect(() => {
    let active = true;
    const accountId = WeeklyReviewRepository.getActiveUser();
    async function hydrate() {
      const result = await WeeklyReviewCloudRepository.load();
      if (!active || WeeklyReviewRepository.getActiveUser() !== accountId) return;
      setBackupPending(WeeklyReviewCloudRepository.getPendingCount());
      setLegacyReviewCount(WeeklyReviewRepository.getLegacyCount());
      if (!dirtyRef.current) {
        const record = result.reviews.find(x => x.weekStart === weekRef.current);
        setAnswers({ ...EMPTY_ANSWERS, ...(record?.answers || {}) });
        setSaved(Boolean(record));
      }
    }
    void hydrate();
    return () => { active = false; };
  }, []);

  const facts = useMemo(() => getWeeklyFacts({
    checkIns: CheckInRepository.getAll(),
    workouts: HistoryRepository.getAll(),
    cardio: CardioRepository.getAll(),
    meals: NutritionRepository.getAll(),
  }, week), [week]);
  const feedback = useMemo(() => buildWeeklyFeedback(facts, answers), [facts, answers]);
  const answeredCount = questions.filter((q) => Boolean(answers[q.key])).length;
  const answered = answeredCount === questions.length;
  function setWeekAndAnswers(newWeek) {
    dirtyRef.current = false;
    weekRef.current = newWeek;
    const review = WeeklyReviewRepository.getByWeek(newWeek);
    setWeek(newWeek);
    setAnswers({ ...EMPTY_ANSWERS, ...(review?.answers || {}) });
    setSaved(Boolean(review));
    setAIFeedback(null);
    setAIError("");
  }
  async function save() {
    if (!answered || backupBusy) return;
    setBackupBusy(true);
    setBackupMessage("Weekly answers saved on this device. Checking cloud backup...");
    setAIFeedback(null);
    setAIError("");
    try {
      const operation = WeeklyReviewCloudRepository.save({ weekStart: week, answers });
      // Local storage is updated before the remote request begins.
      setSaved(true);
      dirtyRef.current = false;
      setBackupPending(WeeklyReviewCloudRepository.getPendingCount());
      const result = await operation;
      setBackupPending(WeeklyReviewCloudRepository.getPendingCount());
      setBackupMessage(result.cloudSaved
        ? "Your weekly answers are backed up to your account."
        : "Saved on this device. Cloud backup will retry when connected.");
    } catch (error) {
      setBackupMessage(error instanceof Error ? error.message : "Unable to save your weekly review.");
    } finally {
      setBackupBusy(false);
    }
  }
  async function retryReviewSync() {
    if (backupBusy) return;
    setBackupBusy(true);
    try {
      await WeeklyReviewCloudRepository.retryPending();
      setBackupPending(WeeklyReviewCloudRepository.getPendingCount());
      setBackupMessage(WeeklyReviewCloudRepository.getPendingCount()
        ? "Some weekly reviews still need cloud backup."
        : "Your weekly reviews are backed up.");
    } finally {
      setBackupBusy(false);
    }
  }
  async function restoreLegacyReviews() {
    if (!window.confirm("Older weekly reviews were saved on this device before TrackFit separated accounts. Only restore them if they belong to your signed-in account. Restore and back them up?")) return;
    const added = WeeklyReviewRepository.importLegacyForCurrentUser();
    setLegacyReviewCount(0);
    setBackupPending(WeeklyReviewCloudRepository.getPendingCount());
    const record = WeeklyReviewRepository.getByWeek(weekRef.current);
    if (!dirtyRef.current) {
      setAnswers({ ...EMPTY_ANSWERS, ...(record?.answers || {}) });
      setSaved(Boolean(record));
    }
    setBackupMessage(`${added} weekly review(s) restored on this device. Cloud backup will retry.`);
    await retryReviewSync();
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
    <main className="screen workouts-v4 tf-weekly-review">
      <section className="v4-workout-hero">
        <Link to="/coach/intelligence" aria-label="Back to coach"><ArrowLeft size={22} /></Link>
        <div><p className="eyebrow">Your coach</p><h1>Weekly check-in</h1>
          <p>A few answers, real training data, and one clear direction for next week.</p></div>
      </section>
      <section className="form-card tf-weekly-navigation" aria-label="Choose review week">
        <button className="tf-weekly-nav-button" type="button" aria-label="Previous week" onClick={() => setWeekAndAnswers(shiftWeek(week,-1))}><ChevronLeft size={22}/></button>
        <strong>Week of {new Date(week+"T12:00:00").toLocaleDateString("en-AU",{day:"numeric",month:"short",year:"numeric"})}</strong>
        <button className="tf-weekly-nav-button" type="button" aria-label="Next week" disabled={week>=currentWeek} onClick={() => setWeekAndAnswers(shiftWeek(week,1))}><ChevronRight size={22}/></button>
      </section>
      <section className="v4-workout-list">
        <div className="v4-section-heading"><div><p className="eyebrow">Your logs</p><h2>This week's numbers</h2></div></div>
        <div className="tf-weekly-stats">
          {[
            ["Strength",`${facts.workouts} workouts`],
            ["Cardio",`${facts.cardioMinutes} minutes`],
            ["Steps",facts.averageSteps === null ? "Not logged" : `${facts.averageSteps.toLocaleString()} / logged day`],
            ["Check-ins",`${facts.checkInDays} days`],
          ].map(([label,value])=><article className="form-card tf-weekly-stat" key={label}><small>{label}</small><strong>{value}</strong></article>)}
        </div>
        <small>Daily steps are total steps for each logged day. Cardio steps are not added again.</small>
      </section>
      <section className="v4-workout-list tf-weekly-questions">
        <div className="v4-section-heading"><div><p className="eyebrow">Your answers</p><h2>How was your week?</h2></div></div>
        <p className="tf-weekly-questions__progress" aria-live="polite">{answeredCount} of {questions.length} answered</p>
        {questions.map((question)=>(
          <fieldset className="form-card tf-weekly-question" key={question.key}>
            <legend>{question.label}</legend>
            <div className="tf-weekly-options">
              {question.options.map(([value, label]) => {
                const checked = answers[question.key] === value;
                return (
                  <label key={value} className={`tf-weekly-choice${checked ? " is-selected" : ""}`}>
                    <input className="tf-weekly-choice__radio" type="radio"
                      name={question.key} value={value} checked={checked}
                      onChange={() => { dirtyRef.current = true; setAnswers((x) => ({...x, [question.key]: value})); setSaved(false); }} />
                    <span className="tf-weekly-choice__indicator" aria-hidden="true" />
                    <span className="tf-weekly-choice__text">{label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
        <label className="form-card tf-weekly-notes"><strong>Anything else for your coach? <span>(optional)</span></strong>
          <textarea rows={3} maxLength={800} value={answers.note} onChange={(event)=>{dirtyRef.current = true;setAnswers((x)=>({...x,note:event.target.value}));setSaved(false);}} placeholder="Wins, challenges, injuries, what you'd like to change..." />
        </label>
        <button type="button" disabled={!answered || backupBusy} onClick={save} className="v4-save-checkin tf-weekly-save">{backupBusy ? "Saving..." : saved ? "Saved — update review" : "Save my weekly check-in"}</button>
        {backupMessage && <p role="status" className="tf-weekly-save-help">{backupMessage}</p>}
        {backupPending > 0 && (
          <section className="form-card" style={{display:"grid",gap:10}} aria-label="Weekly review cloud backup">
            <strong>{backupPending} weekly review{backupPending === 1 ? "" : "s"} awaiting cloud backup</strong>
            <p style={{margin:0}}>Your answers stay on this device and retry when you're online.</p>
            <button type="button" disabled={backupBusy} onClick={retryReviewSync}>
              {backupBusy ? "Syncing..." : "Retry weekly review backup"}
            </button>
          </section>
        )}
        {legacyReviewCount > 0 && (
          <section className="form-card" style={{display:"grid",gap:10}}>
            <strong>{legacyReviewCount} older weekly review{legacyReviewCount === 1 ? "" : "s"} found on this device</strong>
            <p style={{margin:0}}>These records predate account-specific storage. Only restore them if they're yours.</p>
            <button type="button" onClick={restoreLegacyReviews}>Restore my older weekly reviews</button>
          </section>
        )
        {!answered && <p className="tf-weekly-save-help">Choose one answer for each question to save your review.</p>}
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
      <section className="v4-workout-list tf-weekly-photos">
        <div className="v4-section-heading"><div><p className="eyebrow">Progress pictures</p><h2>Compare week to week</h2></div></div>
        <p>Optional front, side and back photos. Saved privately on this device only. They will not sync across devices yet. Clearing browser data can delete them.</p>
        {angles.map((angle)=><PhotoSlot key={angle} angle={angle} weekStart={week} refresh={photoRevision} onPhotoChange={()=>setPhotoRevision((n)=>n+1)} />)}
      </section>
      <nav className="tf-weekly-footer" aria-label="Related tracking"><Link to="/checkin">Daily check-in</Link><Link to="/workouts">Workouts</Link><Link to="/cardio">Cardio</Link></nav>
    </main>
  );
}

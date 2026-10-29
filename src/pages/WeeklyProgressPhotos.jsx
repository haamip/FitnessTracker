import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Camera } from "lucide-react";
import WeeklyPhotoSlot from "../components/weekly/WeeklyPhotoSlot";
import { getWeekStart } from "../services/weeklyCoachReview";
import "./TrackFitScreens.css";
import "./WeeklyCoachReview.css";

const ANGLES = ["front", "side", "back"];
const WEEK_REGEX = /^\d{4}-\d{2}-\d{2}$/;
function safeWeek(param, fallback) {
  if (!WEEK_REGEX.test(param || "")) return fallback;
  const date = new Date(param + "T12:00:00");
  if (Number.isNaN(date.getTime())) return fallback;
  const actual = getWeekStart(date);
  return actual <= fallback ? actual : fallback;
}
function shiftWeek(week, offset) {
  const date = new Date(week + "T12:00:00");
  date.setDate(date.getDate() + offset * 7);
  return getWeekStart(date);
}

export default function WeeklyProgressPhotos() {
  const currentWeek = getWeekStart();
  const [params, setParams] = useSearchParams();
  const week = safeWeek(params.get("week"), currentWeek);
  const [revision, setRevision] = useState(0);
  const changeWeek = (next) => setParams({ week: next });
  return (
    <main className="screen workouts-v4 tf-weekly-review tf-progress-photos" data-testid="trackfit-progress-photos">
      <section className="v4-workout-hero">
        <Link to={`/coach/weekly`} aria-label="Back to weekly review"><ArrowLeft size={22} /></Link>
        <div>
          <p className="eyebrow">Private progress</p>
          <h1>Progress photos</h1>
          <p>Your front, side and back comparisons, separate from your weekly check-in.</p>
        </div>
      </section>
      <section className="form-card tf-weekly-navigation" aria-label="Choose progress photo week">
        <button className="tf-weekly-nav-button" type="button" aria-label="Previous photo week" onClick={() => changeWeek(shiftWeek(week,-1))}><ChevronLeft size={22}/></button>
        <strong>Week of {new Date(week + "T12:00:00").toLocaleDateString("en-AU", {day:"numeric",month:"short",year:"numeric"})}</strong>
        <button className="tf-weekly-nav-button" type="button" aria-label="Next photo week" disabled={week >= currentWeek} onClick={() => changeWeek(shiftWeek(week,1))}><ChevronRight size={22}/></button>
      </section>
      <section className="form-card tf-photo-privacy">
        <Camera size={22} aria-hidden="true"/>
        <p>These photos are stored on this device only, separated by TrackFit account. They are not sent to AI or synced to the cloud. Clearing browser or app storage may permanently remove them.</p>
      </section>
      <section className="v4-workout-list tf-weekly-photos">
        {ANGLES.map(angle => <WeeklyPhotoSlot key={angle} angle={angle} weekStart={week} refresh={revision} onPhotoChange={() => setRevision(x => x+1)} />)}
      </section>
      <p><Link to="/coach/weekly">Back to weekly coaching review</Link></p>
    </main>
  );
}

import { Link } from "react-router-dom";
import { ArrowLeft, CalendarCheck2, PencilLine } from "lucide-react";
import {
  FatigueCard,
  NextWorkoutCard,
  PlateauCard,
  ReadinessCard,
  WeeklyReviewCard,
  WeeklySummaryCard,
} from "../components/coach";
import { buildCoachDashboard } from "../services/engines/coachIntelligenceEngine";
import { CheckInRepository } from "../services/repositories/trackfitDataLayer";
import { getWeekStart, WeeklyReviewRepository } from "../services/weeklyCoachReview";
import useTrackFitDataRefresh from "../hooks/useTrackFitDataRefresh";
import "./CoachIntelligence.css";

export default function CoachIntelligence() {
  const [revision] = useTrackFitDataRefresh();
  void revision;
  const coach = buildCoachDashboard();
  const dailyNotes = CheckInRepository.getAll()
    .filter((record) => Boolean(record.trainingNote?.trim()))
    .slice(0, 5);
  const weeklyNote = String(WeeklyReviewRepository.getByWeek(getWeekStart())?.answers?.note || "").trim();

  return (
    <main className="coach-intelligence-page">
      <Link className="coach-back-link" to="/"><ArrowLeft size={18} aria-hidden="true" /> Back to Coach</Link>
      <section className="coach-hero">
        <p className="eyebrow">TrackFit Intelligence</p>
        <h1>Coaching insights</h1>
        <span>Training advice grounded in your logged workouts, activity and recovery. The numbers are estimates, not medical advice.</span>
      </section>

      <section className="coach-grid">
        <ReadinessCard readiness={coach.readiness} />
        <NextWorkoutCard recommendation={coach.recommendation} />
        <WeeklySummaryCard weeklySummary={coach.weeklySummary} />
        <FatigueCard fatigue={coach.fatigue} />
        <PlateauCard plateau={coach.plateau} />
        <WeeklyReviewCard weeklyReview={coach.weeklyReview} />
      </section>

      <section className="coach-notes-section" aria-labelledby="coach-notes-heading">
        <div className="coach-notes-heading">
          <div>
            <p className="eyebrow">What you've shared</p>
            <h2 id="coach-notes-heading">Coaching notes</h2>
          </div>
          <Link to="/checkin"><PencilLine size={17} aria-hidden="true" /> Add today's note</Link>
        </div>
        <p>Your notes come from your private daily and weekly check-ins. They help you keep track of what affected your training.</p>
        {!dailyNotes.length && !weeklyNote && (
          <div className="coach-note-item">
            <strong>No coaching notes yet</strong>
            <p>Open Daily check-in, choose More details, and add a note about training, sleep or recovery.</p>
          </div>
        )}
        {weeklyNote && (
          <article className="coach-note-item">
            <small>This week's review</small>
            <p>{weeklyNote}</p>
            <Link to="/coach/weekly">Edit weekly review</Link>
          </article>
        )}
        {dailyNotes.map((record) => (
          <article className="coach-note-item" key={record.date}>
            <small>{new Date(record.date + "T12:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</small>
            <p>{record.trainingNote}</p>
            <Link to="/checkin"><CalendarCheck2 size={15} aria-hidden="true" /> Daily check-in</Link>
          </article>
        ))}
        <Link className="coach-notes-weekly-link" to="/coach/weekly">Open weekly check-in and coaching feedback</Link>
      </section>
    </main>
  );
}

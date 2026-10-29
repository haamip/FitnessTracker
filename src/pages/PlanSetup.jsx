import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CalendarCheck2, Dumbbell, Plus, Sparkles, Trash2 } from "lucide-react";
import { AIPlanRepository, WorkoutRepository } from "../services/repositories/trackfitDataLayer";
import "./TrackFitScreens.css";

/**
 * Live overview of the active training split, not a dummy goal form.
 * Completed workout history is stored separately and never deleted here.
 */
export default function PlanSetup() {
  const [plan, setPlan] = useState(() => AIPlanRepository.getPlan());
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const hasPlan = Array.isArray(plan) && plan.length > 0;

  async function deletePlan() {
    if (deleting || !hasPlan) return;
    if (!window.confirm(
      "Delete your entire training plan? The plan days and their unfinished drafts will be removed. Completed workout history and separately saved workouts will stay."
    )) return;
    setDeleting(true);
    setMessage("");
    try {
      // Cloud first. Never say deleted if Supabase rejects the request.
      await AIPlanRepository.deletePlan();
      for (const day of plan) {
        if (day?.id) WorkoutRepository.removeById(day.id);
      }
      setPlan([]);
      setMessage("Training plan deleted. Completed workout history and your saved workouts are safe.");
    } catch (error) {
      setMessage(error instanceof Error
        ? `Could not delete your training plan: ${error.message}`
        : "Could not delete your training plan. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="screen" data-testid="trackfit-training-plan">
      <section className="v4-workout-hero">
        <Link to="/workouts" aria-label="Back to workouts"><ArrowLeft size={21} /></Link>
        <div>
          <p className="eyebrow">Training</p>
          <h1>Your training plan</h1>
          <p>See your current split, open a session, or build a new plan.</p>
        </div>
      </section>

      {!hasPlan ? (
        <section className="form-card" style={{ display: "grid", gap: 14, padding: 20 }}>
          <Sparkles size={28} aria-hidden="true" />
          <h2>No training plan saved yet</h2>
          <p>Create a plan around your goal, equipment and training days. You can still use your separately saved workouts.</p>
          <Link className="primary-button" to="/workouts/builder" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 48 }}>
            <Plus size={18} /> Build my training plan
          </Link>
          <Link to="/workouts">View my workouts <ArrowRight size={16} aria-hidden="true" /></Link>
        </section>
      ) : (
        <>
          <section className="form-card" style={{ display: "grid", gap: 12, padding: 20 }}>
            <p className="eyebrow">Active split</p>
            <h2>{plan.length}-day training plan</h2>
            <p>Open any day to see and log its exercises. Rebuild to change your goal or schedule.</p>
            <Link className="primary-button" to="/workouts/builder" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 48 }}>
              <Sparkles size={18} /> Build a replacement plan
            </Link>
          </section>

          <section className="v4-workout-list">
            <div className="v4-section-heading"><div><p className="eyebrow">Your sessions</p><h2>Plan days</h2></div></div>
            {plan.filter(day => day?.id).map((day, index) => (
              <Link className="v4-quick-card" to={`/workouts/${encodeURIComponent(day.id)}`} key={day.id}
                style={{ display: "flex", alignItems: "center", gap: 14, minHeight: 64 }}>
                <CalendarCheck2 size={24} aria-hidden="true" />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <strong>Day {index + 1}: {day.name || "Workout"}</strong>
                  <small style={{ display: "block" }}>{(day.exercises || []).length} exercises · {day.time || "60"} minutes · {day.focus || "Training"}</small>
                </span>
                <ArrowRight size={20} aria-hidden="true" />
              </Link>
            ))}
          </section>

          <section className="form-card" style={{ display: "grid", gap: 10, padding: 20 }}>
            <h2>Manage your plan</h2>
            <p>Deleting your plan removes its days and unfinished drafts, but never your completed workout history or separately saved workouts.</p>
            <button type="button" disabled={deleting} onClick={deletePlan}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 48, border: "1px solid #b74c43", borderRadius: 12, background: "#fff6f4", color: "#8f2822", fontWeight: 800 }}>
              <Trash2 size={18} /> {deleting ? "Deleting plan..." : "Delete entire training plan"}
            </button>
          </section>
        </>
      )}
      {message && <p role="status" style={{ marginTop: 16, fontWeight: 700 }}>{message}</p>}
      <p style={{ marginTop: 18 }}>
        <Link to="/checkin"><CalendarCheck2 size={17} aria-hidden="true" /> Daily check-in</Link>
        {" · "}
        <Link to="/coach/intelligence"><Dumbbell size={17} aria-hidden="true" /> Coaching insights</Link>
      </p>
    </main>
  );
}

import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Clock3, Dumbbell, Pencil, Trophy } from "lucide-react";
import { HistoryRepository } from "../services/repositories/trackfitDataLayer";
import "./TrackFitScreens.css";

export default function CompletedWorkoutDetail() {
  const { historyId } = useParams();
  const [workout, setWorkout] = useState(() =>
    HistoryRepository.getAll().find((item) => item.id === historyId),
  );
  const [editingDuration, setEditingDuration] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(() =>
    Math.max(1, Math.round((workout?.seconds || 0) / 60)),
  );

  if (!workout) {
    return (
      <main className="screen completed-workout-detail">
        <Link className="tf-back-link" to="/workouts">
          <ArrowLeft size={20} /> Back to workouts
        </Link>
        <section className="tf-history-empty">
          <strong>Workout not found</strong>
          <span>This saved session may have been cleared from demo data.</span>
        </section>
      </main>
    );
  }

  function saveDuration() {
    const minutes = Math.max(1, Number.parseInt(durationMinutes, 10) || 1);
    const updated = HistoryRepository.update(workout.id, {
      seconds: minutes * 60,
    });
    setWorkout(updated);
    setDurationMinutes(minutes);
    setEditingDuration(false);
  }

  return (
    <main className="screen completed-workout-detail">
      <Link className="tf-back-link" to="/workouts">
        <ArrowLeft size={20} /> Back to workouts
      </Link>

      <section className="tf-history-hero">
        <Trophy size={30} />
        <p className="eyebrow">Completed workout</p>
        <h1>{workout.title}</h1>
        <span>{new Date(workout.completedAt).toLocaleString("en-AU")}</span>
      </section>

      <section className="tf-complete-stats history-detail-stats">
        <article>
          <Clock3 size={18} />
          <strong>{Math.round((workout.seconds || 0) / 60)} min</strong>
          <span>Duration</span>
          <button type="button" onClick={() => setEditingDuration(true)}>
            <Pencil size={15} /> Edit
          </button>
        </article>
        <article>
          <Dumbbell size={18} />
          <strong>{workout.completedSets || 0}/{workout.totalSets || 0}</strong>
          <span>Sets</span>
        </article>
        <article>
          <strong>{Math.round(workout.volume || 0)}kg</strong>
          <span>Volume</span>
        </article>
        <article>
          <strong>{workout.prs?.length || 0}</strong>
          <span>PRs</span>
        </article>
      </section>

      {editingDuration && (
        <section className="tf-session-note-card">
          <strong>Edit workout duration</strong>
          <label>
            Minutes
            <input
              inputMode="numeric"
              min="1"
              type="number"
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(event.target.value)}
            />
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={saveDuration}>Save time</button>
            <button type="button" onClick={() => setEditingDuration(false)}>Cancel</button>
          </div>
        </section>
      )}

      {workout.notes && (
        <section className="tf-session-note-card">
          <strong>Notes</strong>
          <p>{workout.notes}</p>
        </section>
      )}
    </main>
  );
}

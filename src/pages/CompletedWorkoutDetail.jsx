import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Clock3, Dumbbell, Trophy } from "lucide-react";
import { HistoryRepository } from "../services/trackfitDataLayer";
import "./TrackFitScreens.css";

/**
 * CompletedWorkoutDetail
 *
 * Read-only workout history detail page. This prevents history cards from
 * opening a missing route and gives testers a proper saved-session view.
 */
export default function CompletedWorkoutDetail() {
  const { historyId } = useParams();
  const history = HistoryRepository.getAll();
  const workout = history.find((item) => item.id === historyId);

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
        </article>
        <article>
          <Dumbbell size={18} />
          <strong>
            {workout.completedSets || 0}/{workout.totalSets || 0}
          </strong>
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

      {workout.notes && (
        <section className="tf-session-note-card">
          <strong>Notes</strong>
          <p>{workout.notes}</p>
        </section>
      )}
    </main>
  );
}

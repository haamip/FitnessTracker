import { useMemo } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  Dumbbell,
  Lightbulb,
  Repeat2,
  ShieldAlert,
  Sparkles,
  Trophy,
} from "lucide-react";
import ExerciseImage from "../components/ui/ExerciseImage";
import {
  findExerciseById,
  formatKg,
  getCoachTips,
  getCommonMistakes,
  getExerciseAlternatives,
  getExerciseHistoryStats,
} from "../services/engines/exerciseInsightEngine";
import { readWorkoutHistory } from "../services/workoutEngine";
import "./TrackFitScreens.css";

/**
 * Converts enum-style data into readable UI text.
 *
 * Exercise metadata still uses developer-friendly keys such as
 * `horizontal_push`, while the screen should display polished copy such as
 * `Horizontal Push`.
 */
function pretty(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * ExerciseDetail
 *
 * Knowledge page for one exercise. The important navigation detail here is the
 * back button: when the user opens this page from an active workout, it returns
 * to that exact workout session instead of dumping them back into the Workout
 * Builder or generic Train list.
 */
export default function ExerciseDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const exercise = findExerciseById(id);
  const history = useMemo(() => readWorkoutHistory(), []);
  const stats = useMemo(
    () => getExerciseHistoryStats(history, exercise),
    [exercise, history],
  );
  const alternatives = useMemo(
    () => getExerciseAlternatives(exercise),
    [exercise],
  );
  const coachTips = useMemo(() => getCoachTips(exercise), [exercise]);
  const mistakes = useMemo(() => getCommonMistakes(exercise), [exercise]);

  /**
   * Keeps the exercise detail page compatible with multiple entry points.
   *
   * - Active workout session: uses Link state from WorkoutDetail.jsx.
   * - Normal library browsing: falls back to the Train page.
   */
  function handleBack() {
    const returnTo = location.state?.returnTo;

    if (returnTo) {
      navigate(returnTo);
      return;
    }

    navigate("/workouts");
  }

  if (!exercise) {
    return (
      <main className="screen tf-exercise-detail-page">
        <button className="tf-back-pill" onClick={handleBack} type="button">
          <ArrowLeft size={18} /> Back
        </button>
        <section className="tf-empty-workout">
          <strong>Exercise not found</strong>
          <span>The library item may have been renamed or removed.</span>
        </section>
      </main>
    );
  }

  return (
    <main className="screen tf-exercise-detail-page">
      <button className="tf-back-pill" onClick={handleBack} type="button">
        <ArrowLeft size={18} /> Back
      </button>

      {/* Exercise identity block: quick visual + the most useful metadata. */}
      <section className="tf-exercise-detail-hero">
        <div className="tf-exercise-hero-art" aria-hidden="true">
          <ExerciseImage exercise={exercise} />
        </div>
        <div>
          <p>Exercise Detail</p>
          <h1>{exercise.name}</h1>
          <span>
            {pretty(exercise.movementPattern)} Ã¢â‚¬Â¢{" "}
            {pretty(exercise.difficulty)}
          </span>
        </div>
      </section>

      <section className="tf-detail-chip-grid">
        <article>
          <Dumbbell size={18} />
          <strong>
            {(exercise.equipment || []).join(", ") || "Bodyweight"}
          </strong>
          <span>Equipment</span>
        </article>
        <article>
          <Sparkles size={18} />
          <strong>
            {(exercise.primaryMuscles || []).join(", ") || "General"}
          </strong>
          <span>Primary</span>
        </article>
        <article>
          <BarChart3 size={18} />
          <strong>
            {exercise.defaultSets || 3} x {exercise.defaultReps || "8-12"}
          </strong>
          <span>Default</span>
        </article>
      </section>

      {/* Personal performance is calculated from completed workout history. */}
      <section className="tf-exercise-stat-panel">
        <div className="tf-section-title-row">
          <div>
            <p>History</p>
            <h2>Your numbers</h2>
          </div>
          <Trophy size={22} />
        </div>

        <div className="tf-detail-stat-grid">
          <article>
            <strong>{stats.sessions}</strong>
            <span>Sessions</span>
          </article>
          <article>
            <strong>{formatKg(stats.totalVolume)}</strong>
            <span>Total volume</span>
          </article>
          <article>
            <strong>
              {stats.bestE1rm ? `${stats.bestE1rm}kg` : "Ã¢â‚¬â€"}
            </strong>
            <span>Best e1RM</span>
          </article>
        </div>

        {stats.bestSet && (
          <div className="tf-best-set-card">
            <strong>Best Set</strong>
            <span>
              {stats.bestSet.weight}kg x {stats.bestSet.reps} reps
            </span>
          </div>
        )}
      </section>

      {exercise.instructions?.length > 0 && (
        <section className="tf-detail-card">
          <div className="tf-section-title-row">
            <div>
              <p>Technique</p>
              <h2>How to perform</h2>
            </div>
          </div>
          <ol>
            {exercise.instructions.slice(0, 6).map((instruction) => (
              <li key={instruction}>{instruction}</li>
            ))}
          </ol>
        </section>
      )}

      <section className="tf-detail-card">
        <div className="tf-section-title-row">
          <div>
            <p>Coach Notes</p>
            <h2>Tips</h2>
          </div>
          <Lightbulb size={22} />
        </div>
        <ul>
          {coachTips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>

      <section className="tf-detail-card warning">
        <div className="tf-section-title-row">
          <div>
            <p>Watch Out</p>
            <h2>Common mistakes</h2>
          </div>
          <ShieldAlert size={22} />
        </div>
        <ul>
          {mistakes.map((mistake) => (
            <li key={mistake}>{mistake}</li>
          ))}
        </ul>
      </section>

      <section className="tf-detail-card">
        <div className="tf-section-title-row">
          <div>
            <p>Swap Options</p>
            <h2>Alternatives</h2>
          </div>
          <Repeat2 size={22} />
        </div>
        <div className="tf-alternative-list">
          {alternatives.map((alternative) => (
            <Link
              to={`/exercises/${alternative.id}`}
              key={alternative.id}
              state={location.state}
            >
              <strong>{alternative.name}</strong>
              <span>{pretty(alternative.movementPattern)}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

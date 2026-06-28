import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
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
import {
  findExerciseById,
  formatKg,
  getCoachTips,
  getCommonMistakes,
  getExerciseAlternatives,
  getExerciseHistoryStats,
} from "../services/exerciseInsightEngine";
import { readWorkoutHistory } from "../services/workoutEngine";
import "./TrackFitScreens.css";

function pretty(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ExerciseHeroImage({ exercise }) {
  return (
    <div className="tf-exercise-hero-art" aria-hidden="true">
      {exercise.image ? <img src={exercise.image} alt="" /> : <span>TF</span>}
    </div>
  );
}

/**
 * TrackFit v0.6 Exercise Detail page.
 *
 * This turns each library item into a mini knowledge page: instructions, tips,
 * common mistakes, alternatives and personal history. This is the foundation
 * for the future muscle-map and AI Coach experience.
 */
export default function ExerciseDetail() {
  const { id } = useParams();
  const exercise = findExerciseById(id);
  const history = useMemo(() => readWorkoutHistory(), []);
  const stats = useMemo(() => getExerciseHistoryStats(history, exercise), [exercise, history]);
  const alternatives = useMemo(() => getExerciseAlternatives(exercise), [exercise]);
  const coachTips = useMemo(() => getCoachTips(exercise), [exercise]);
  const mistakes = useMemo(() => getCommonMistakes(exercise), [exercise]);

  if (!exercise) {
    return (
      <main className="screen tf-exercise-detail-page">
        <Link className="tf-back-pill" to="/workouts">
          <ArrowLeft size={18} /> Back
        </Link>
        <section className="tf-empty-workout">
          <strong>Exercise not found</strong>
          <span>The library item may have been renamed or removed.</span>
        </section>
      </main>
    );
  }

  return (
    <main className="screen tf-exercise-detail-page">
      <Link className="tf-back-pill" to="/workouts">
        <ArrowLeft size={18} /> Back
      </Link>

      {/* Exercise identity block: quick visual + the most useful metadata. */}
      <section className="tf-exercise-detail-hero">
        <ExerciseHeroImage exercise={exercise} />
        <div>
          <p>Exercise Detail</p>
          <h1>{exercise.name}</h1>
          <span>{pretty(exercise.movementPattern)} • {pretty(exercise.difficulty)}</span>
        </div>
      </section>

      <section className="tf-detail-chip-grid">
        <article>
          <Dumbbell size={18} />
          <strong>{(exercise.equipment || []).join(", ") || "Bodyweight"}</strong>
          <span>Equipment</span>
        </article>
        <article>
          <Sparkles size={18} />
          <strong>{(exercise.primaryMuscles || []).join(", ") || "General"}</strong>
          <span>Primary</span>
        </article>
        <article>
          <BarChart3 size={18} />
          <strong>{exercise.defaultSets || 3} x {exercise.defaultReps || "8-12"}</strong>
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
            <strong>{stats.bestE1rm ? `${stats.bestE1rm}kg` : "—"}</strong>
            <span>Best e1RM</span>
          </article>
        </div>

        {stats.bestSet && (
          <div className="tf-best-set-card">
            <strong>Best Set</strong>
            <span>{stats.bestSet.weight}kg x {stats.bestSet.reps} reps</span>
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
          {coachTips.map((tip) => <li key={tip}>{tip}</li>)}
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
          {mistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}
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
            <Link to={`/exercises/${alternative.id}`} key={alternative.id}>
              <strong>{alternative.name}</strong>
              <span>{pretty(alternative.movementPattern)}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

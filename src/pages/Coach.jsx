/*
 * TRACKFIT PAGE
 *
 * Purpose:
 * Main responsibility of this page.
 *
 * Data:
 * Repository and services used by this page.
 *
 * Features:
 * - Feature 1
 * - Feature 2
 * - Feature 3
 *
 * Future:
 * Planned improvements after MVP.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Brain,
  ChevronRight,
  Clock3,
  Dumbbell,
  HelpCircle,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";

import { generateDailyCoachBrief } from "../services/engines/aiCoachEngine";
import { readWorkoutHistory } from "../services/workoutEngine";
import "./TrackFitScreens.css";

export default function Coach() {
  const [showWhy, setShowWhy] = useState(false);
  const workoutHistory = useMemo(() => readWorkoutHistory(), []);
  const coach = useMemo(
    () => generateDailyCoachBrief(workoutHistory),
    [workoutHistory],
  );

  return (
    <main className="screen tf-coach-page">
      {/* Coach hero: the first thing users see should answer "what should I do today?" */}
      <section className="tf-coach-hero">
        <div>
          <p className="eyebrow">Training Coach</p>
          <h1>{coach.title}</h1>
          <p>{coach.readiness.note}</p>
        </div>

        <div
          className="tf-coach-score"
          style={{ "--score": `${coach.readiness.score}%` }}
        >
          <strong>{coach.readiness.score}</strong>
          <span>{coach.readiness.label}</span>
        </div>
      </section>

      {/* Next best move: one clean recommendation instead of making the user think. */}
      <section className="tf-coach-action-card tf-next-move-card">
        <div className="tf-icon-disc">
          <Sparkles size={23} />
        </div>
        <div>
          <p className="eyebrow">Next best move</p>
          <h2>{coach.nextBestMove.title}</h2>
          <p>{coach.nextBestMove.detail}</p>
        </div>
        <Link to={coach.nextBestMove.route}>
          {coach.nextBestMove.action} <ChevronRight size={17} />
        </Link>
      </section>

      <section className="tf-coach-card tf-last-session-card">
        <div className="tf-section-title-row">
          <div>
            <p className="eyebrow">Last session</p>
            <h2>{coach.lastSession.title}</h2>
          </div>
          <Dumbbell size={22} />
        </div>

        <p>{coach.lastSession.note}</p>

        <div className="tf-last-session-grid">
          <article>
            <Clock3 size={18} />
            <strong>{coach.lastSession.durationLabel}</strong>
            <span>{coach.lastSession.dateLabel}</span>
          </article>
          <article>
            <Activity size={18} />
            <strong>{coach.lastSession.sets}</strong>
            <span>sets</span>
          </article>
          <article>
            <TrendingUp size={18} />
            <strong>{coach.lastSession.volumeLabel}</strong>
            <span>volume</span>
          </article>
          <article>
            <Trophy size={18} />
            <strong>{coach.lastSession.prs}</strong>
            <span>PRs</span>
          </article>
        </div>
      </section>

      {/* Suggested workout card: backup action if the user wants the old direct start flow. */}
      <section className="tf-coach-action-card compact">
        <div className="tf-icon-disc">
          <Dumbbell size={23} />
        </div>
        <div>
          <p className="eyebrow">Suggested workout</p>
          <h2>{coach.suggestedWorkout.title}</h2>
          <p>{coach.suggestedWorkout.reason}</p>
        </div>
        <Link to={coach.suggestedWorkout.route}>
          Start <ChevronRight size={17} />
        </Link>
      </section>

      <section className="tf-coach-metrics">
        <article>
          <TrendingUp size={20} />
          <strong>{coach.weeklySummary.workouts}</strong>
          <span>sessions</span>
        </article>
        <article>
          <Trophy size={20} />
          <strong>{coach.weeklySummary.totalPrs}</strong>
          <span>PR signals</span>
        </article>
        <article>
          <Target size={20} />
          <strong>{coach.benchGoal.percent}%</strong>
          <span>bench goal</span>
        </article>
      </section>

      <section className="tf-coach-card">
        <div className="tf-section-title-row">
          <div>
            <p className="eyebrow">Weekly report</p>
            <h2>Training summary</h2>
          </div>
          <Sparkles size={22} />
        </div>
        <p>{coach.weeklySummaryText}</p>
      </section>

      {coach.plateaus.length > 0 && (
        <section className="tf-coach-card warning">
          <div className="tf-section-title-row">
            <div>
              <p className="eyebrow">Plateau watch</p>
              <h2>Needs attention</h2>
            </div>
            <ShieldCheck size={22} />
          </div>
          {coach.plateaus.map((plateau) => (
            <article className="tf-coach-list-row" key={plateau.exercise}>
              <strong>{plateau.exercise}</strong>
              <span>{plateau.message}</span>
            </article>
          ))}
        </section>
      )}

      <section className="tf-coach-card">
        <button
          className="tf-why-button"
          onClick={() => setShowWhy((current) => !current)}
          type="button"
        >
          <HelpCircle size={20} />
          {showWhy ? "Hide reasoning" : "Why this recommendation?"}
        </button>

        {showWhy && (
          <div className="tf-why-list">
            {coach.reasons.map((reason) => (
              <p key={reason}>- {reason}</p>
            ))}
          </div>
        )}
      </section>

      <section className="tf-coach-card">
        <div className="tf-section-title-row">
          <div>
            <p className="eyebrow">Recovery map</p>
            <h2>Muscles to watch</h2>
          </div>
          <Brain size={22} />
        </div>

        {coach.readiness.muscles.length === 0 ? (
          <p>
            Log workouts with exercises from the library and TrackFit will build
            your recovery map.
          </p>
        ) : (
          <div className="tf-recovery-list">
            {coach.readiness.muscles.map((item) => (
              <div key={item.muscle}>
                <span>{item.muscle.replaceAll("_", " ")}</span>
                <strong>{item.score}%</strong>
                <div>
                  <i style={{ width: `${item.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

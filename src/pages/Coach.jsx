import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Brain,
  ChevronRight,
  Dumbbell,
  HelpCircle,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";

import { generateDailyCoachBrief } from "../services/aiCoachEngine";
import { readWorkoutHistory } from "../services/workoutEngine";
import "./TrackFitScreens.css";

export default function Coach() {
  const [showWhy, setShowWhy] = useState(false);
  const workoutHistory = useMemo(() => readWorkoutHistory(), []);
  const coach = useMemo(() => generateDailyCoachBrief(workoutHistory), [workoutHistory]);

  return (
    <main className="screen tf-coach-page">
      {/* Coach hero: the first thing users see should answer “what should I do today?” */}
      <section className="tf-coach-hero">
        <div>
          <p className="eyebrow">AI Coach v0.7</p>
          <h1>{coach.title}</h1>
          <p>{coach.readiness.note}</p>
        </div>

        <div className="tf-coach-score" style={{ "--score": `${coach.readiness.score}%` }}>
          <strong>{coach.readiness.score}</strong>
          <span>{coach.readiness.label}</span>
        </div>
      </section>

      {/* Suggested workout card: one tap moves the user from coaching into action. */}
      <section className="tf-coach-action-card">
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
        <button className="tf-why-button" onClick={() => setShowWhy((current) => !current)} type="button">
          <HelpCircle size={20} />
          {showWhy ? "Hide reasoning" : "Why this recommendation?"}
        </button>

        {showWhy && (
          <div className="tf-why-list">
            {coach.reasons.map((reason) => (
              <p key={reason}>• {reason}</p>
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
          <p>Log workouts with exercises from the library and TrackFit will build your recovery map.</p>
        ) : (
          <div className="tf-recovery-list">
            {coach.readiness.muscles.map((item) => (
              <div key={item.muscle}>
                <span>{item.muscle.replaceAll("_", " ")}</span>
                <strong>{item.score}%</strong>
                <div><i style={{ width: `${item.score}%` }} /></div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

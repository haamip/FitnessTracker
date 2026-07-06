/*
 * TRACKFIT PAGE
 *
 * Purpose:
 * Deeper coaching and reasoning screen.
 *
 * Data:
 * Reads unified Coach Intelligence output.
 *
 * Features:
 * - Next best move
 * - Training summary
 * - Nutrition and movement support signals
 * - Recommendation reasoning
 *
 * Future:
 * AI-generated coach response using the same intelligence object.
 */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Beef,
  Brain,
  ChevronRight,
  Clock3,
  Dumbbell,
  Flame,
  Footprints,
  HelpCircle,
  Moon,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Waves,
} from "lucide-react";

import { buildCoachDashboard } from "../services/engines/coachIntelligenceEngine";
import "./TrackFitScreens.css";

export default function Coach() {
  const [showWhy, setShowWhy] = useState(false);
  const coach = useMemo(() => buildCoachDashboard(), []);
  const decision = coach.decision;

  const supportSignals = [
    {
      icon: Beef,
      label: "Protein",
      value: `${coach.nutrition.protein}g`,
      note: coach.nutrition.message,
      route: "/nutrition",
    },
    {
      icon: Flame,
      label: "Calories",
      value: coach.nutrition.calories.toLocaleString(),
      note: `${coach.nutrition.calorieTarget.toLocaleString()} target`,
      route: "/nutrition",
    },
    {
      icon: Waves,
      label: "Water",
      value: `${decision.signals.recovery.recoveryScore}%`,
      note: decision.signals.recovery.status,
      route: "/checkin",
    },
    {
      icon: Moon,
      label: "Recovery",
      value: `${coach.readiness.score}%`,
      note: coach.readiness.status,
      route: "/checkin",
    },
    {
      icon: Footprints,
      label: "Steps",
      value: Math.round(coach.movement.steps).toLocaleString(),
      note: `${coach.movement.distanceKm.toFixed(1)}km today`,
      route: "/cardio",
    },
  ];

  return (
    <main className="screen tf-coach-page">
      <section className="tf-coach-hero">
        <div>
          <p className="eyebrow">Training Coach</p>
          <h1>{decision.trainingIntensity} day</h1>
          <p>{decision.coachSummary}</p>
        </div>

        <div
          className="tf-coach-score"
          style={{ "--score": `${coach.readiness.score}%` }}
        >
          <strong>{coach.readiness.score}</strong>
          <span>{coach.readiness.status}</span>
        </div>
      </section>

      <section className="tf-coach-action-card tf-next-move-card">
        <div className="tf-icon-disc">
          <Sparkles size={23} />
        </div>
        <div>
          <p className="eyebrow">Next best move</p>
          <h2>{coach.recommendation.workout}</h2>
          <p>{coach.recommendation.reason}</p>
        </div>
        <Link to={coach.recommendation.route}>
          {coach.recommendation.action} <ChevronRight size={17} />
        </Link>
      </section>

      <section className="tf-coach-card">
        <div className="tf-section-title-row">
          <div>
            <p className="eyebrow">Support signals</p>
            <h2>Food, movement and recovery</h2>
          </div>
          <Brain size={22} />
        </div>

        <section className="v4-stat-grid">
          {supportSignals.map((item) => (
            <Link className="v4-stat-card" key={item.label} to={item.route}>
              <item.icon size={21} />
              <strong>{item.value}</strong>
              <span>{item.label}</span>
              <small>{item.note}</small>
            </Link>
          ))}
        </section>
      </section>

      <section className="tf-coach-card">
        <div className="tf-section-title-row">
          <div>
            <p className="eyebrow">Weekly report</p>
            <h2>Training summary</h2>
          </div>
          <Sparkles size={22} />
        </div>
        <p>{coach.weeklySummary.message}</p>
      </section>

      <section className="tf-coach-metrics">
        <article>
          <TrendingUp size={20} />
          <strong>{coach.weeklySummary.sessions}</strong>
          <span>sessions</span>
        </article>

        <article>
          <Activity size={20} />
          <strong>
            {Math.round(coach.weeklySummary.volume).toLocaleString()}
          </strong>
          <span>weekly volume</span>
        </article>

        <article>
          <Target size={20} />
          <strong>{coach.weeklyReview.score}%</strong>
          <span>weekly review</span>
        </article>
      </section>

      <section className="tf-coach-card tf-last-session-card">
        <div className="tf-section-title-row">
          <div>
            <p className="eyebrow">Fatigue</p>
            <h2>{coach.fatigue.level}</h2>
          </div>
          <Dumbbell size={22} />
        </div>

        <p>{coach.fatigue.advice}</p>

        <div className="tf-last-session-grid">
          <article>
            <Clock3 size={18} />
            <strong>{Math.round(coach.weeklySummary.durationMinutes)}</strong>
            <span>minutes</span>
          </article>
          <article>
            <Activity size={18} />
            <strong>{coach.weeklySummary.sets}</strong>
            <span>sets</span>
          </article>
          <article>
            <TrendingUp size={18} />
            <strong>
              {Math.round(coach.weeklySummary.volume).toLocaleString()}
            </strong>
            <span>volume</span>
          </article>
          <article>
            <Trophy size={18} />
            <strong>{coach.decision.opportunities.length}</strong>
            <span>opportunities</span>
          </article>
        </div>
      </section>

      {coach.plateau.detected && (
        <section className="tf-coach-card warning">
          <div className="tf-section-title-row">
            <div>
              <p className="eyebrow">Plateau watch</p>
              <h2>{coach.plateau.exercise}</h2>
            </div>
            <ShieldCheck size={22} />
          </div>
          <p>{coach.plateau.message}</p>
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
            <p>- Decision score: {decision.decisionScore}%.</p>
            <p>- Training intensity: {decision.trainingIntensity}.</p>
            <p>- Main recommendation: {decision.nextBestMove.detail}</p>
            {decision.limiters.map((limiter) => (
              <p key={limiter}>- Limiter: {limiter}</p>
            ))}
            {decision.opportunities.map((opportunity) => (
              <p key={opportunity}>- Opportunity: {opportunity}</p>
            ))}
          </div>
        )}
      </section>

      <section className="tf-coach-card">
        <div className="tf-section-title-row">
          <div>
            <p className="eyebrow">Recovery map</p>
            <h2>Decision signals</h2>
          </div>
          <Brain size={22} />
        </div>

        <div className="tf-recovery-list">
          <div>
            <span>recovery</span>
            <strong>{decision.signals.recovery.recoveryScore}%</strong>
            <div>
              <i
                style={{ width: `${decision.signals.recovery.recoveryScore}%` }}
              />
            </div>
          </div>

          <div>
            <span>nutrition</span>
            <strong>{decision.signals.nutrition.score}%</strong>
            <div>
              <i style={{ width: `${decision.signals.nutrition.score}%` }} />
            </div>
          </div>

          <div>
            <span>movement</span>
            <strong>{decision.signals.movement.score}%</strong>
            <div>
              <i style={{ width: `${decision.signals.movement.score}%` }} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

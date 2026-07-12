/*
 * TRACKFIT PAGE
 *
 * Purpose:
 * Coach-first home screen for the everyday TrackFit experience.
 *
 * The intelligence engines continue to calculate recovery, nutrition,
 * movement, fatigue and training decisions behind the scenes. This page
 * deliberately exposes only the small amount of information the user needs
 * to act today.
 */

import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Beef,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  Moon,
  Sparkles,
  Utensils,
} from "lucide-react";

import { buildCoachDashboard } from "../services/engines/coachIntelligenceEngine";
import "./Coach.css";

export default function Coach() {
  const coach = useMemo(() => buildCoachDashboard(), []);
  const decision = coach.decision;

  return (
    <main className="screen coach-home">
      <section className="coach-welcome">
        <div>
          <p className="coach-kicker">Your daily coach</p>
          <h1>Ready when you are.</h1>
          <p>{decision.coachSummary}</p>
        </div>

        <div
          className="coach-readiness"
          style={{ "--readiness": `${coach.readiness.score}%` }}
          aria-label={`Readiness ${coach.readiness.score} percent`}
        >
          <div>
            <strong>{coach.readiness.score}</strong>
            <span>{coach.readiness.status}</span>
          </div>
        </div>
      </section>

      <section className="coach-focus-card">
        <div className="coach-focus-icon" aria-hidden="true">
          <Dumbbell size={25} />
        </div>

        <div className="coach-focus-copy">
          <p className="coach-kicker">Today&apos;s focus</p>
          <h2>{coach.recommendation.workout}</h2>
          <p>{coach.recommendation.reason}</p>
        </div>

        <Link className="coach-primary-action" to={coach.recommendation.route}>
          {coach.recommendation.action}
          <ArrowRight size={19} />
        </Link>
      </section>

      <section className="coach-message-card">
        <div className="coach-message-heading">
          <span>
            <Sparkles size={19} />
          </span>
          <p className="coach-kicker">Coach says</p>
        </div>
        <h2>{decision.nextBestMove.detail}</h2>
      </section>

      <section className="coach-essentials">
        <div className="coach-section-heading">
          <div>
            <p className="coach-kicker">Today</p>
            <h2>Keep the basics moving</h2>
          </div>
        </div>

        <div className="coach-essential-grid">
          <Link to="/nutrition" className="coach-essential-card">
            <span className="coach-essential-icon">
              <Beef size={20} />
            </span>
            <div>
              <small>Protein</small>
              <strong>{coach.nutrition.protein}g</strong>
              <p>{coach.nutrition.message}</p>
            </div>
            <ChevronRight size={18} />
          </Link>

          <Link to="/checkin" className="coach-essential-card">
            <span className="coach-essential-icon">
              <Moon size={20} />
            </span>
            <div>
              <small>Recovery</small>
              <strong>{coach.readiness.score}%</strong>
              <p>{coach.readiness.status}</p>
            </div>
            <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      <section className="coach-quick-links" aria-label="Quick actions">
        <Link to="/checkin">
          <CheckCircle2 size={20} />
          <span>
            <strong>Daily check-in</strong>
            <small>Update how you feel today</small>
          </span>
          <ChevronRight size={18} />
        </Link>

        <Link to="/nutrition">
          <Utensils size={20} />
          <span>
            <strong>Log food</strong>
            <small>Keep calories and protein current</small>
          </span>
          <ChevronRight size={18} />
        </Link>
      </section>
    </main>
  );
}

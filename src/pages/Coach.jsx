import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Activity, ArrowRight, ArrowUpRight, CalendarCheck2, ChevronRight,
  Dumbbell, HeartPulse, TrendingUp, Utensils,
} from "lucide-react";
import { buildCoachDashboard } from "../services/engines/coachIntelligenceEngine";
import "./Coach.css";

const shortcuts = [
  { to: "/workouts", label: "Workouts", detail: "Start or build a session", icon: Dumbbell },
  { to: "/checkin", label: "Daily check-in", detail: "Sleep, weight and recovery", icon: CalendarCheck2 },
  { to: "/nutrition", label: "Nutrition", detail: "Log meals and targets", icon: Utensils },
  { to: "/progress", label: "Progress", detail: "See your training trend", icon: TrendingUp },
];

export default function Coach() {
  const coach = useMemo(() => buildCoachDashboard(), []);
  const today = new Intl.DateTimeFormat("en-NZ", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <div className="screen tf-home" data-testid="trackfit-home">
      <section className="tf-home-intro">
        <div>
          <p className="tf-overline">YOUR TRAINING HQ <span aria-hidden="true">/</span> {today}</p>
          <h1>Make today count<span className="tf-lime-dot">.</span></h1>
          <p>Training, recovery and nutrition. All in one place.</p>
        </div>
        <Link to="/dashboard" className="tf-intro-link">Full dashboard <ArrowUpRight size={17} aria-hidden="true" /></Link>
      </section>

      <section className="tf-feature" aria-labelledby="tf-next-title">
        <div className="tf-feature-top">
          <span className="tf-feature-label"><span className="tf-live-dot" /> TODAY'S FOCUS</span>
          <span className="tf-feature-tag">YOUR COACH</span>
        </div>
        <div className="tf-feature-body">
          <div className="tf-feature-copy">
            <p className="tf-feature-overline">01 / NEXT MOVE</p>
            <h2 id="tf-next-title">{coach.recommendation.workout}</h2>
            <p>{coach.recommendation.reason}</p>
          </div>
          <div className="tf-feature-score" aria-label={`Estimated training readiness ${coach.readiness.score} out of 100. ${coach.readiness.status}`}>
            <span>READINESS*</span>
            <strong>{coach.readiness.score}<small>/100</small></strong>
            <em>{coach.readiness.status}</em>
          </div>
        </div>
        <div className="tf-feature-actions">
          <Link to={coach.recommendation.route} className="tf-feature-primary">
            {coach.recommendation.action} <ArrowUpRight size={19} aria-hidden="true" />
          </Link>
          <Link to="/plan" className="tf-feature-secondary">View training plan <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
        <p className="tf-feature-disclaimer">*Training readiness is an estimate based on your logged activity, not a medical assessment.</p>
      </section>

      <section className="tf-home-section" aria-labelledby="tf-snapshot-title">
        <div className="tf-section-title"><div><p className="tf-overline">THE NUMBERS</p><h2 id="tf-snapshot-title">Your week at a glance</h2></div><Link to="/dashboard">View all <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
        <div className="tf-snapshot">
          <Link to="/dashboard" className="tf-snapshot-card"><Dumbbell size={20} aria-hidden="true" /><strong>{coach.weeklySummary.sessions}</strong><span>Sessions this week</span><ChevronRight size={17} aria-hidden="true" /></Link>
          <Link to="/nutrition" className="tf-snapshot-card"><Utensils size={20} aria-hidden="true" /><strong>{coach.nutrition.protein}<small>g</small></strong><span>Protein today</span><ChevronRight size={17} aria-hidden="true" /></Link>
          <Link to="/cardio" className="tf-snapshot-card"><Activity size={20} aria-hidden="true" /><strong>{Math.round(coach.movement.weeklyMinutes)}<small>min</small></strong><span>Movement this week</span><ChevronRight size={17} aria-hidden="true" /></Link>
        </div>
      </section>

      <section className="tf-home-section" aria-labelledby="tf-actions-title">
        <div className="tf-section-title"><div><p className="tf-overline">NO DIGGING AROUND</p><h2 id="tf-actions-title">Jump straight in</h2></div></div>
        <div className="tf-shortcuts">
          {shortcuts.map(({ to, label, detail, icon: Icon }, index) => (
            <Link to={to} key={to} className="tf-shortcut">
              <span className="tf-shortcut-icon"><Icon size={23} aria-hidden="true" /></span>
              <span className="tf-shortcut-copy"><small>0{index + 1}</small><strong>{label}</strong><span>{detail}</span></span>
              <ArrowUpRight className="tf-shortcut-arrow" size={20} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <section className="tf-home-note">
        <div className="tf-home-note-icon"><HeartPulse size={24} aria-hidden="true" /></div>
        <div><p className="tf-overline">COACH'S NOTE</p><h2>Work with your body, not against it.</h2><p>{coach.fatigue.advice}</p><Link to="/coach/intelligence">Explore your insights <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
      </section>
    </div>
  );
}

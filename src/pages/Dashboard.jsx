import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Activity, ArrowLeft, ArrowUpRight, CalendarCheck2, Dumbbell,
  HeartPulse, Scale, TrendingUp, Utensils,
} from "lucide-react";
import { buildCoachDashboard } from "../services/engines/coachIntelligenceEngine";
import { CheckInRepository } from "../services/repositories/trackfitDataLayer";
import "./Dashboard.css";

function number(value) {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

export default function Dashboard() {
  const coach = useMemo(() => buildCoachDashboard(), []);
  const latestCheckIn = useMemo(() => CheckInRepository.getAll()[0] || null, []);
  const weight = number(latestCheckIn?.weightKg ?? latestCheckIn?.weight);
  const sleep = number(latestCheckIn?.sleepHours ?? latestCheckIn?.sleep);

  const metrics = [
    { label: "Training sessions", value: String(coach.weeklySummary.sessions), unit: "this week", icon: Dumbbell, to: "/workouts" },
    { label: "Volume lifted", value: Math.round(coach.weeklySummary.volume).toLocaleString(), unit: "kg this week", icon: TrendingUp, to: "/progress" },
    { label: "Protein", value: String(coach.nutrition.protein), unit: "g today", icon: Utensils, to: "/nutrition" },
    { label: "Movement", value: String(Math.round(coach.movement.weeklyMinutes)), unit: "min this week", icon: Activity, to: "/cardio" },
  ];

  return (
    <div className="screen tf-dashboard" data-testid="trackfit-dashboard">
      <Link to="/" className="tf-dashboard-back"><ArrowLeft size={16} aria-hidden="true" /> Back to home</Link>
      <section className="tf-dashboard-hero">
        <p className="tf-dashboard-kicker">YOUR TRAINING / THE BIG PICTURE</p>
        <h1>Your performance.<br />Without the noise<span>.</span></h1>
        <p>This is your recorded activity, not a demo. Keep logging and your picture gets clearer.</p>
      </section>

      <section className="tf-dashboard-section" aria-labelledby="tf-dashboard-week">
        <div className="tf-dashboard-heading"><div><p className="tf-dashboard-kicker">YOUR DATA</p><h2 id="tf-dashboard-week">Week in numbers</h2></div><span>LIVE RECORDS</span></div>
        <div className="tf-dashboard-metrics">
          {metrics.map(({ label, value, unit, icon: Icon, to }) => (
            <Link to={to} className="tf-dashboard-metric" key={label}>
              <Icon size={22} aria-hidden="true" /><span>{label}</span><strong>{value}</strong><small>{unit}</small><ArrowUpRight className="tf-dashboard-metric-arrow" size={18} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <section className="tf-dashboard-section" aria-labelledby="tf-dashboard-recovery">
        <div className="tf-dashboard-heading"><div><p className="tf-dashboard-kicker">PERSONAL CHECK-IN</p><h2 id="tf-dashboard-recovery">Recovery and body</h2></div><Link to="/checkin">Update <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
        <div className="tf-dashboard-recovery">
          <div><Scale size={22} aria-hidden="true" /><span>Latest weight</span><strong>{weight ? `${weight.toFixed(1)} kg` : "Not logged"}</strong></div>
          <div><HeartPulse size={22} aria-hidden="true" /><span>Latest sleep</span><strong>{sleep ? `${sleep.toFixed(1)} hours` : "Not logged"}</strong></div>
          <div><CalendarCheck2 size={22} aria-hidden="true" /><span>Training readiness*</span><strong>{coach.readiness.score}/100</strong></div>
        </div>
        <p className="tf-dashboard-fineprint">*Readiness is an estimate from logged activity, not a medical assessment.</p>
      </section>

      <section className="tf-dashboard-insight">
        <p className="tf-dashboard-kicker">WEEKLY REVIEW</p>
        <h2>What your training is telling you.</h2>
        <p>{coach.weeklyReview.message}</p>
        <Link to="/coach/intelligence">Open coaching insights <ArrowUpRight size={17} aria-hidden="true" /></Link>
      </section>
    </div>
  );
}

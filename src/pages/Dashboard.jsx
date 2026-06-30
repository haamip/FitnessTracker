import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Activity,
  Award,
  ChevronRight,
  Dumbbell,
  Flame,
  Moon,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Waves,
} from "lucide-react";

import LineChartCard from "../components/LineChartCard";
import GamificationPanel from "../components/ui/GamificationPanel";
import { generateDailyCoachBrief } from "../services/aiCoachEngine";
import { getAllTimePRs } from "../services/prEngine";
import { readWorkoutHistory } from "../services/workoutEngine";
import { getWeeklyTrainingSummary } from "../services/workoutSummaryEngine";
import "./TrackFitScreens.css";

const weightData = [
  { date: "Mon", weight: 105.0 },
  { date: "Tue", weight: 104.8 },
  { date: "Wed", weight: 104.6 },
  { date: "Thu", weight: 104.5 },
  { date: "Fri", weight: 104.2 },
];

const stats = [
  { icon: Flame, label: "Calories", value: "2,184", note: "416 left" },
  { icon: Waves, label: "Water", value: "3.1L", note: "Goal 4L" },
  { icon: Moon, label: "Sleep", value: "7.4h", note: "Solid" },
  { icon: Scale, label: "Weight", value: "104.2", note: "Down 0.8kg" },
];

const achievements = [
  { icon: Trophy, title: "12 day streak", detail: "Still showing up." },
  { icon: Award, title: "4 sessions", detail: "This week locked in." },
  { icon: ShieldCheck, title: "Protein nailed", detail: "185g target close." },
];

export default function Dashboard() {
  const workoutHistory = useMemo(() => readWorkoutHistory(), []);
  const weeklySummary = useMemo(() => getWeeklyTrainingSummary(workoutHistory), [workoutHistory]);
  const coachBrief = useMemo(() => generateDailyCoachBrief(workoutHistory), [workoutHistory]);
  const allTimePrs = useMemo(() => getAllTimePRs(workoutHistory), [workoutHistory]);

  return (
    <motion.div
      className="screen dashboard-v4"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Hero card: keeps the dashboard personal and goal-focused. */}
      <section className="v4-hero">
        <div className="v4-hero__top">
          <div>
            <p className="eyebrow">Good morning</p>
            <h1>Haami</h1>
            <p>Small wins stacked daily. That is how the big change happens.</p>
          </div>

          <div className="v4-ring" style={{ "--progress": "62%" }}>
            <div>
              <strong>62%</strong>
              <span>to goal</span>
            </div>
          </div>
        </div>

        <div className="v4-goal-strip">
          <div>
            <span>Current</span>
            <strong>104.2kg</strong>
          </div>
          <div>
            <span>Goal</span>
            <strong>95kg</strong>
          </div>
          <div>
            <span>Lost</span>
            <strong>0.8kg</strong>
          </div>
        </div>
      </section>

      <GamificationPanel />

      {/* Workout Intelligence cards are fed from real completed workout history. */}
      <section className="tf-intelligence-grid">
        <article>
          <Sparkles size={20} />
          <strong>{coachBrief.title}</strong>
          <span>{coachBrief.readiness.note}</span>
        </article>
        <article>
          <Dumbbell size={20} />
          <strong>{weeklySummary.workouts}</strong>
          <span>workouts this week</span>
        </article>
        <article>
          <Activity size={20} />
          <strong>{Math.round(weeklySummary.totalVolume).toLocaleString()}</strong>
          <span>kg lifted this week</span>
        </article>
        <article>
          <Trophy size={20} />
          <strong>{weeklySummary.totalPrs}</strong>
          <span>PRs this week</span>
        </article>
      </section>

      {/* Daily AI Coach card: converts workout history into one recommended action. */}
      <section className="v4-today-card">
        <div className="v4-icon-bubble">
          <Dumbbell size={22} />
        </div>

        <div className="v4-today-card__main">
          <p className="eyebrow">Today&apos;s recommendation</p>
          <h2>{coachBrief.suggestedWorkout.title}</h2>
          <p>{coachBrief.reasons[0]}</p>
        </div>

        <Link className="v4-start-btn" to={coachBrief.suggestedWorkout.route}>
          Start <ChevronRight size={17} />
        </Link>
      </section>

      <div className="v4-section-heading">
        <div>
          <p className="eyebrow">Daily targets</p>
          <h2>Today so far</h2>
        </div>
        <span>Live</span>
      </div>

      <section className="v4-stat-grid">
        {stats.map((item) => (
          <article className="v4-stat-card" key={item.label}>
            <item.icon size={21} />
            <strong>{item.value}</strong>
            <span>{item.label}</span>
            <small>{item.note}</small>
          </article>
        ))}
      </section>

      <LineChartCard title="Weight Trend" data={weightData} dataKey="weight" unit="kg" />

      {allTimePrs.length > 0 && (
        <section className="tf-pr-strip">
          <div className="v4-section-heading">
            <div>
              <p className="eyebrow">Strength intelligence</p>
              <h2>Top estimated PRs</h2>
            </div>
          </div>

          {allTimePrs.slice(0, 3).map((pr) => (
            <article key={pr.exercise}>
              <strong>{pr.exercise}</strong>
              <span>{pr.set} â€¢ e1RM {pr.e1rm}kg</span>
            </article>
          ))}
        </section>
      )}

      <section className="v4-coach-card">
        <div>
          <p className="eyebrow">Training Coach</p>
          <h2>Your coach is watching the pattern.</h2>
          <p>{coachBrief.weeklySummaryText}</p>
        </div>
        <Sparkles size={24} />
      </section>

      <div className="v4-section-heading">
        <div>
          <p className="eyebrow">Wins</p>
          <h2>Achievements</h2>
        </div>
      </div>

      <section className="v4-achievement-list">
        {achievements.map((item) => (
          <article className="v4-achievement-card" key={item.title}>
            <div className="v4-icon-bubble small">
              <item.icon size={18} />
            </div>
            <div>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="v4-mini-summary">
        <Activity size={18} />
        <span>Consistency beats perfect. Old-school truth, modern app.</span>
        <Target size={18} />
      </section>
    </motion.div>
  );
}

import { motion } from "framer-motion";
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

import Button from "../components/ui/Button";
import LineChartCard from "../components/LineChartCard";
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
  return (
    <motion.div
      className="screen dashboard-v4"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
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

      <section className="v4-today-card">
        <div className="v4-icon-bubble">
          <Dumbbell size={22} />
        </div>

        <div className="v4-today-card__main">
          <p className="eyebrow">Today&apos;s workout</p>
          <h2>Upper Strength</h2>
          <p>6 exercises · around 55 mins</p>
        </div>

        <Button className="v4-start-btn">
          Start <ChevronRight size={17} />
        </Button>
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

      <section className="v4-coach-card">
        <div>
          <p className="eyebrow">AI Coach</p>
          <h2>Recovery looks decent today.</h2>
          <p>Keep the upper session controlled and finish with easy cardio.</p>
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
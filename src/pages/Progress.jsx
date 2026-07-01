import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Brain,
  Dumbbell,
  Flame,
  Medal,
  Scale,
  Target,
  TrendingDown,
  Trophy,
} from "lucide-react";

import LineChartCard from "../components/LineChartCard";
import { getAllTimePRs } from "../services/prEngine";
import { readWorkoutHistory } from "../services/workoutEngine";
import { getWeeklyTrainingSummary } from "../services/workoutSummaryEngine";
import "./TrackFitScreens.css";

const weightData = [
  { date: "Week 1", weight: 106.8 },
  { date: "Week 2", weight: 106.1 },
  { date: "Week 3", weight: 105.4 },
  { date: "Week 4", weight: 104.9 },
  { date: "Week 5", weight: 104.2 },
];

const measurements = [
  { label: "Waist", value: "102cm", change: "-3cm" },
  { label: "Chest", value: "116cm", change: "+1cm" },
  { label: "Arms", value: "39cm", change: "+0.5cm" },
  { label: "Legs", value: "62cm", change: "steady" },
];

const fallbackPrs = [
  { exercise: "Bench Press", e1rm: 100, set: "100kg" },
  { exercise: "Squat", e1rm: 80, set: "80kg" },
  { exercise: "Deadlift", e1rm: 100, set: "100kg" },
];

export default function Progress() {
  const workoutHistory = useMemo(() => readWorkoutHistory(), []);
  const weeklySummary = useMemo(() => getWeeklyTrainingSummary(workoutHistory), [workoutHistory]);
  const prData = useMemo(() => getAllTimePRs(workoutHistory), [workoutHistory]);
  const displayedPrs = prData.length > 0 ? prData : fallbackPrs;

  return (
    <motion.div
      className="screen progress-v4"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <section className="v4-progress-hero">
        <div>
          <p className="eyebrow">Progress</p>
          <h1>104.2kg</h1>
          <p>Down 2.6kg from your starting point. Still moving in the right direction.</p>
        </div>

        <div className="v4-progress-ring" style={{ "--progress": "62%" }}>
          <div>
            <strong>62%</strong>
            <span>goal</span>
          </div>
        </div>
      </section>

      {/* These cards now include live workout intelligence from saved sessions. */}
      <section className="v4-progress-summary">
        <article>
          <TrendingDown size={21} />
          <strong>-2.6kg</strong>
          <span>Total lost</span>
        </article>

        <article>
          <Flame size={21} />
          <strong>{weeklySummary.workouts}</strong>
          <span>Workouts / wk</span>
        </article>

        <article>
          <Activity size={21} />
          <strong>{Math.round(weeklySummary.totalVolume / 1000)}k</strong>
          <span>Kg lifted</span>
        </article>
      </section>

      <LineChartCard title="Weight Trend" data={weightData} dataKey="weight" unit="kg" />

      <div className="v4-section-heading">
        <div>
          <p className="eyebrow">Strength</p>
          <h2>Personal records</h2>
        </div>
        <span>PRs</span>
      </div>

      <section className="v4-pr-grid">
        {displayedPrs.slice(0, 3).map((item, index) => {
          const Icon = index === 0 ? Trophy : index === 1 ? Medal : Dumbbell;

          return (
            <article className="v4-pr-card" key={item.exercise}>
              <Icon size={22} />
              <strong>{item.e1rm}kg</strong>
              <span>{item.exercise}</span>
              <small>{item.set}</small>
            </article>
          );
        })}
      </section>

      <div className="v4-section-heading">
        <div>
          <p className="eyebrow">Body tracking</p>
          <h2>Measurements</h2>
        </div>
      </div>

      <section className="v4-measure-list">
        {measurements.map((item) => (
          <article className="v4-measure-row" key={item.label}>
            <div>
              <strong>{item.label}</strong>
              <span>{item.value}</span>
            </div>
            <small>{item.change}</small>
          </article>
        ))}
      </section>

      <section className="v4-ai-insight">
        <div className="v4-icon-bubble">
          <Brain size={22} />
        </div>

        <div>
          <p className="eyebrow">Coach insight</p>
          <h2>{weeklySummary.totalPrs > 0 ? "Strength is moving." : "Build the data trail."}</h2>
          <p>
            {weeklySummary.totalPrs > 0
              ? `${weeklySummary.totalPrs} PR signals this week. Keep logging clean sets so the coach can progress you properly.`
              : "Log a few completed workouts and TrackFit will start showing true PRs, volume and next-session targets."}
          </p>
        </div>
      </section>

      <section className="v4-mini-summary">
        <Scale size={18} />
        <span>Progress is the proof. Keep stacking boring wins.</span>
        <Target size={18} />
      </section>
    </motion.div>
  );
}

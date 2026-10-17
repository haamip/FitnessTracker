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
import { useMemo } from "react";
import { Link } from "react-router-dom";
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
import { CheckInRepository } from "../services/repositories/trackfitDataLayer";
import { getWeeklyTrainingSummary } from "../services/workoutSummaryEngine";
import "./TrackFitScreens.css";

export default function Progress() {
  const workoutHistory = useMemo(() => readWorkoutHistory(), []);
  const weeklySummary = useMemo(
    () => getWeeklyTrainingSummary(workoutHistory),
    [workoutHistory],
  );
  const prData = useMemo(() => getAllTimePRs(workoutHistory), [workoutHistory]);
  const displayedPrs = prData;
  const weightData = useMemo(() => CheckInRepository.getAll()
    .filter((item) => Number(item.weightKg ?? item.weight) > 0)
    .sort((a,b) => a.date.localeCompare(b.date))
    .map((item) => ({ date:item.date.slice(5), weight:Number(item.weightKg ?? item.weight) })), []);
  const latestWeight = weightData.length ? weightData.at(-1).weight : null;
  const weightChange = weightData.length > 1 ? Math.round((latestWeight - weightData[0].weight) * 10)/10 : null;

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
          <h1>{latestWeight === null ? "No weight logged" : `${latestWeight.toFixed(1)}kg`}</h1>
          <p>{weightChange === null ? "Log your weight in a daily check-in to start a real trend." : `${weightChange > 0 ? "+" : ""}${weightChange}kg since your first saved weigh-in.`}</p>
        </div>

        <div style={{ alignSelf: "center" }}><Link to="/coach/weekly">Weekly review + photos →</Link></div>
      </section>

      {/* These cards now include live workout intelligence from saved sessions. */}
      <section className="v4-progress-summary">
        <article>
          <TrendingDown size={21} />
          <strong>{weightChange === null ? "—" : `${weightChange > 0 ? "+" : ""}${weightChange}kg`}</strong>
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

      {weightData.length > 1 && <LineChartCard
        title="Weight Trend"
        data={weightData}
        dataKey="weight"
        unit="kg"
      />}

      <div className="v4-section-heading">
        <div>
          <p className="eyebrow">Strength</p>
          <h2>Personal records</h2>
        </div>
        <span>PRs</span>
      </div>

      <section className="v4-pr-grid">
        {displayedPrs.length === 0 && <p>No real personal records logged yet.</p>}
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

      <section className="v4-workout-list">
        <div className="v4-section-heading"><div><p className="eyebrow">Body tracking</p><h2>Weekly progress photos</h2></div></div>
        <p>Compare your own weekly photos privately, and see your coach's feedback from logged training and daily check-ins.</p>
        <Link to="/coach/weekly">Open weekly review and photos →</Link>
      </section>

      <section className="v4-ai-insight">
        <div className="v4-icon-bubble">
          <Brain size={22} />
        </div>

        <div>
          <p className="eyebrow">Coach insight</p>
          <h2>
            {weeklySummary.totalPrs > 0
              ? "Strength is moving."
              : "Build the data trail."}
          </h2>
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

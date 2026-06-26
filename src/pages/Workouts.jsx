import { motion } from "framer-motion";
import {
  Activity,
  ChevronRight,
  Dumbbell,
  Flame,
  Plus,
  Timer,
  Trophy,
} from "lucide-react";

import Button from "../components/ui/Button";
import "./TrackFitScreens.css";

const workouts = [
  {
    id: "upper",
    name: "Upper Strength",
    detail: "Chest, back, shoulders and arms",
    tag: "Today",
    time: "55 min",
    intensity: "Heavy",
    progress: "72%",
  },
  {
    id: "lower",
    name: "Lower Strength",
    detail: "Quads, hamstrings, glutes and core",
    tag: "Next",
    time: "50 min",
    intensity: "Build",
    progress: "48%",
  },
  {
    id: "full",
    name: "Full Body",
    detail: "Strength, conditioning and sweat",
    tag: "Backup",
    time: "45 min",
    intensity: "Balanced",
    progress: "35%",
  },
];

const quickActions = [
  { icon: Dumbbell, title: "Quick lift", detail: "Log a session" },
  { icon: Timer, title: "Rest timer", detail: "Start clock" },
];

export default function Workouts() {
  return (
    <motion.div
      className="screen workouts-v4"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <section className="v4-workout-hero">
        <div>
          <p className="eyebrow">Training plan</p>
          <h1>Workouts</h1>
          <p>Pick the session, hit the work, track the progress. No fluff.</p>
        </div>

        <div className="v4-hero-badge">
          <Trophy size={20} />
          <span>4 this week</span>
        </div>
      </section>

      <section className="v4-quick-grid">
        {quickActions.map((item) => (
          <button className="v4-quick-card" key={item.title} type="button">
            <item.icon size={22} />
            <strong>{item.title}</strong>
            <span>{item.detail}</span>
          </button>
        ))}
      </section>

      <div className="v4-section-heading">
        <div>
          <p className="eyebrow">Your plan</p>
          <h2>Sessions</h2>
        </div>

        <Button className="v4-add-btn">
          <Plus size={17} />
          Add
        </Button>
      </div>

      <section className="v4-workout-list">
        {workouts.map((workout) => (
          <a className="v4-workout-card" href={`/workouts/${workout.id}`} key={workout.id}>
            <div className="v4-workout-card__top">
              <span className="v4-chip">{workout.tag}</span>
              <span className="v4-time">{workout.time}</span>
            </div>

            <div className="v4-workout-card__body">
              <div className="v4-workout-icon">
                <Dumbbell size={22} />
              </div>

              <div>
                <h3>{workout.name}</h3>
                <p>{workout.detail}</p>
              </div>

              <ChevronRight className="v4-chevron" size={20} />
            </div>

            <div className="v4-workout-card__footer">
              <span>
                <Flame size={15} />
                {workout.intensity}
              </span>

              <div className="v4-workout-progress">
                <i style={{ width: workout.progress }} />
              </div>
            </div>
          </a>
        ))}
      </section>

      <section className="v4-mini-summary">
        <Activity size={18} />
        <span>Next step: make each workout detail screen feel like a proper gym mode.</span>
        <Dumbbell size={18} />
      </section>
    </motion.div>
  );
}
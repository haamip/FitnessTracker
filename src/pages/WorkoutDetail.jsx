import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  NotepadText,
  Play,
  TimerReset,
} from "lucide-react";

import Button from "../components/ui/Button";
import "./TrackFitScreens.css";

const exercises = [
  { name: "Bench Press", weight: "100kg", sets: ["Set 1", "Set 2", "Set 3"], done: 2, reps: "3 x 6" },
  { name: "Incline DB Press", weight: "35kg", sets: ["Set 1", "Set 2", "Set 3"], done: 1, reps: "3 x 10" },
  { name: "Lat Pulldown", weight: "80kg", sets: ["Set 1", "Set 2", "Set 3"], done: 0, reps: "3 x 10" },
  { name: "Shoulder Press", weight: "28kg", sets: ["Set 1", "Set 2", "Set 3"], done: 0, reps: "3 x 8" },
];

export default function WorkoutDetail() {
  return (
    <motion.div
      className="screen workout-detail-v4"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <section className="v4-detail-hero">
        <a className="v4-back-link" href="/workouts">
          <ArrowLeft size={18} />
          Back
        </a>

        <p className="eyebrow">Training mode</p>
        <h1>Upper Strength</h1>
        <p>Chest, back, shoulders and arms. Controlled reps. Big effort.</p>

        <div className="v4-detail-progress">
          <div>
            <strong>72%</strong>
            <span>Complete</span>
          </div>
          <i>
            <b style={{ width: "72%" }} />
          </i>
        </div>

        <div className="v4-detail-meta">
          <span><Clock size={15} /> 55 min</span>
          <span><Dumbbell size={15} /> 6 exercises</span>
          <span><Flame size={15} /> Heavy</span>
        </div>
      </section>

      <section className="v4-current-exercise">
        <div className="v4-current-head">
          <div>
            <p className="eyebrow">Current exercise</p>
            <h2>Bench Press</h2>
            <span>100kg working sets</span>
          </div>

          <div className="v4-current-icon">
            <Dumbbell size={24} />
          </div>
        </div>

        <div className="v4-set-grid-detail">
          {["Set 1", "Set 2", "Set 3"].map((set, index) => (
            <button
              className={index < 2 ? "v4-set-tile done" : "v4-set-tile"}
              type="button"
              key={set}
            >
              {index < 2 ? <CheckCircle2 size={18} /> : <span />}
              <strong>{set}</strong>
              <small>{index < 2 ? "Done" : "Tap when complete"}</small>
            </button>
          ))}
        </div>

        <Button className="v4-complete-btn">
          Complete next set
        </Button>
      </section>

      <section className="v4-rest-card">
        <div>
          <p className="eyebrow">Rest timer</p>
          <h2>01:30</h2>
          <span>Recommended between heavy sets</span>
        </div>

        <button className="v4-timer-btn" type="button">
          <Play size={18} />
        </button>
      </section>

      <div className="v4-section-heading">
        <div>
          <p className="eyebrow">Workout flow</p>
          <h2>Exercises</h2>
        </div>
      </div>

      <section className="v4-exercise-list">
        {exercises.map((exercise, index) => (
          <article className={index === 0 ? "v4-exercise-row active" : "v4-exercise-row"} key={exercise.name}>
            <div className="v4-exercise-number">
              {index + 1}
            </div>

            <div>
              <strong>{exercise.name}</strong>
              <p>{exercise.reps} · {exercise.weight}</p>
            </div>

            <span>{exercise.done}/{exercise.sets.length}</span>
          </article>
        ))}
      </section>

      <section className="v4-notes-card">
        <NotepadText size={20} />
        <div>
          <p className="eyebrow">Notes</p>
          <h2>Felt strong today</h2>
          <span>Add notes here later for PRs, pain, energy and form cues.</span>
        </div>
      </section>

      <section className="v4-mini-summary">
        <TimerReset size={18} />
        <span>Gym Mode next: bigger buttons, swipe sets, rest timer always visible.</span>
        <Dumbbell size={18} />
      </section>
    </motion.div>
  );
}
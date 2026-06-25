import { Check, Dumbbell, Timer, Trophy } from "lucide-react";
import Card from "../components/ui/Card";
import "./TrackFitScreens.css";

const exercises = [
  { name: "Bench Press", target: "70kg x 8", sets: ["Set 1", "Set 2", "Set 3", "Set 4"] },
  { name: "Lat Pulldown", target: "65kg x 10", sets: ["Set 1", "Set 2", "Set 3", "Set 4"] },
  { name: "Shoulder Press", target: "28kg x 8", sets: ["Set 1", "Set 2", "Set 3"] },
];

export default function WorkoutDetail() {
  return (
    <div className="screen">
      <section className="screen-hero hero-premium">
        <p className="eyebrow">Active workout</p>
        <h1>Upper Strength</h1>
        <p>Beat last week. Keep form clean.</p>
      </section>

      <div className="action-row">
        <button className="action-card"><Timer /><strong>01:24</strong><span>Rest timer</span></button>
        <button className="action-card"><Dumbbell /><strong>8,240kg</strong><span>Volume</span></button>
      </div>

      <Card>
        <p className="eyebrow">Current exercise</p>
        <h2 className="page-title">Bench Press</h2>
        <p className="page-subtitle">70kg · 8 reps · 4 working sets</p>
        <button className="primary-button primary-button-spaced">
          <Check size={18} /> Complete Set
        </button>
      </Card>

      <div className="list-stack">
        {exercises.map((exercise) => (
          <section className="exercise-card" key={exercise.name}>
            <div className="exercise-card-head">
              <div>
                <h3>{exercise.name}</h3>
                <p>{exercise.target}</p>
              </div>
              <Trophy size={18} />
            </div>

            <div className="set-grid">
              {exercise.sets.map((set, index) => (
                <button className={index === 0 ? "set-pill done" : "set-pill"} key={set}>
                  {index === 0 ? "✓" : ""} {set}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      <button className="finish-button">Finish Workout</button>
    </div>
  );
}
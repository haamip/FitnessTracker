import { Dumbbell, ChevronRight, Flame, Timer } from "lucide-react";
import "./TrackFitScreens.css";

const workouts = [
  { name: "Upper Body", detail: "Chest, back, shoulders", tag: "Today" },
  { name: "Lower Body", detail: "Quads, hamstrings, glutes", tag: "Next" },
  { name: "Full Body", detail: "Strength and conditioning", tag: "45 min" },
];

export default function Workouts() {
  return (
    <div className="screen">
      <section className="screen-hero">
        <p className="eyebrow">Training</p>
        <h1>Workouts</h1>
        <p>Pick a session and get moving.</p>
      </section>

      <div className="action-row">
        <button className="action-card"><Dumbbell /><strong>Start</strong><span>Quick lift</span></button>
        <button className="action-card"><Timer /><strong>Timer</strong><span>Rest clock</span></button>
      </div>

      <div className="list-stack">
        {workouts.map((workout) => (
          <div className="list-card" key={workout.name}>
            <div className="list-card-main">
              <div className="icon-bubble"><Flame /></div>
              <div>
                <h3>{workout.name}</h3>
                <p>{workout.detail}</p>
              </div>
            </div>
            <span className="pill">{workout.tag}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


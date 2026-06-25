import { Link } from "react-router-dom";
import { ChevronRight, Dumbbell, Flame, Timer } from "lucide-react";
import "./TrackFitScreens.css";

const workouts = [
  { id: "upper", name: "Upper Strength", detail: "Chest, back, shoulders", tag: "Today", time: "55 min" },
  { id: "lower", name: "Lower Strength", detail: "Quads, hamstrings, glutes", tag: "Next", time: "50 min" },
  { id: "full", name: "Full Body", detail: "Strength and conditioning", tag: "Build", time: "45 min" },
];

export default function Workouts() {
  return (
    <div className="screen">
      <section className="screen-hero hero-premium">
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
          <Link className="list-card workout-link" to={`/workouts/${workout.id}`} key={workout.id}>
            <div className="list-card-main">
              <div className="icon-bubble"><Flame /></div>
              <div>
                <h3>{workout.name}</h3>
                <p>{workout.detail} · {workout.time}</p>
              </div>
            </div>
            <div className="list-card-end">
              <span className="pill">{workout.tag}</span>
              <ChevronRight size={18} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
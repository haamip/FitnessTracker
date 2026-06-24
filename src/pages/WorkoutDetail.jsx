import { Check, Dumbbell, Timer } from "lucide-react";
import Card from "../components/ui/Card";
import "./TrackFitScreens.css";

const exercises = [
  ["Bench Press", "80kg x 8", "Set 3 / 4"],
  ["Lat Pulldown", "65kg x 10", "Set 2 / 4"],
  ["Shoulder Press", "28kg x 8", "Set 2 / 3"],
];

export default function WorkoutDetail() {
  return (
    <div className="screen">
      <section className="screen-hero">
        <p className="eyebrow">Active workout</p>
        <h1>Upper Body</h1>
        <p>Beat last week. Keep form clean.</p>
      </section>

      <Card>
        <p className="eyebrow">Current set</p>
        <h2 className="page-title">Bench Press</h2>
        <p className="page-subtitle">80kg · 8 reps · Set 3 of 4</p>
        <button className="primary-button" style={{ marginTop: 18 }}>
          Complete Set
        </button>
      </Card>

      <div className="action-row">
        <button className="action-card"><Timer /><strong>01:24</strong><span>Rest timer</span></button>
        <button className="action-card"><Dumbbell /><strong>8,240kg</strong><span>Total volume</span></button>
      </div>

      <div className="list-stack">
        {exercises.map(([name, weight, set]) => (
          <div className="list-card" key={name}>
            <div className="list-card-main">
              <div className="icon-bubble"><Check /></div>
              <div>
                <h3>{name}</h3>
                <p>{weight}</p>
              </div>
            </div>
            <span className="pill">{set}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


import { BadgeCheck, Flame, Scale } from "lucide-react";
import "./TrackFitScreens.css";

export default function PlanSetup() {
  return (
    <div className="screen">
      <section className="screen-hero">
        <p className="eyebrow">Setup</p>
        <h1>Your Plan</h1>
        <p>Set the target. Track the work.</p>
      </section>

      <div className="form-card">
        <div className="form-grid">
          <label>Goal<select><option>Lose weight</option><option>Build muscle</option><option>Get stronger</option></select></label>
          <label>Current weight<input placeholder="104.2kg" /></label>
          <label>Goal weight<input placeholder="95kg" /></label>
          <button className="primary-button">Save Plan</button>
        </div>
      </div>

      <div className="action-row">
        <button className="action-card"><Scale /><strong>95kg</strong><span>Target</span></button>
        <button className="action-card"><Flame /><strong>2,600</strong><span>Calories</span></button>
      </div>

      <div className="list-card">
        <div className="list-card-main">
          <div className="icon-bubble"><BadgeCheck /></div>
          <div>
            <h3>Simple V1 plan</h3>
            <p>Track workouts, cardio, weight and daily habits.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Droplets, Moon, Smile, Utensils } from "lucide-react";
import Card from "../components/ui/Card";
import "./TrackFitScreens.css";

export default function DailyCheckIn() {
  return (
    <div className="screen">
      <section className="screen-hero hero-premium">
        <p className="eyebrow">Daily reset</p>
        <h1>Check In</h1>
        <p>Keep it honest. Keep it simple.</p>
      </section>

      <Card>
        <p className="eyebrow">Protein target</p>
        <h2 className="page-title">148 / 185g</h2>
        <div className="progress-line progress-line-dark"><span style={{ width: "80%" }}></span></div>
      </Card>

      <div className="metric-grid">
        <Card className="metric-card"><Droplets /><strong>3.1L</strong><span>Water</span></Card>
        <Card className="metric-card"><Moon /><strong>7.4h</strong><span>Sleep</span></Card>
        <Card className="metric-card"><Utensils /><strong>2,184</strong><span>Calories</span></Card>
        <Card className="metric-card"><Smile /><strong>Good</strong><span>Mood</span></Card>
      </div>

      <div className="form-card">
        <label>Today&apos;s note</label>
        <textarea rows="4" placeholder="How did training and food go?"></textarea>
        <button className="primary-button primary-button-spaced">Save Check In</button>
      </div>
    </div>
  );
}
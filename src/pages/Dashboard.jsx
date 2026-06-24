import { Dumbbell, Droplets, Flame, Moon, TrendingDown, Plus } from "lucide-react";
import Card from "../components/ui/Card";
import "./TrackFitScreens.css";

export default function Dashboard() {
  return (
    <div className="screen">
      <section className="screen-hero">
        <p className="eyebrow">Good morning</p>
        <h1>Haami</h1>
        <p>Ready to get stronger today?</p>
      </section>

      <Card>
        <p className="eyebrow">Today&apos;s workout</p>
        <h2 className="page-title">Upper Body</h2>
        <p className="page-subtitle">Chest, back, shoulders</p>
        <button className="primary-button" style={{ marginTop: 18 }}>
          Start Workout
        </button>
      </Card>

      <div className="metric-grid">
        <Card className="metric-card"><Flame /><strong>2,184</strong><span>Calories</span></Card>
        <Card className="metric-card"><Droplets /><strong>3.1L</strong><span>Water</span></Card>
        <Card className="metric-card"><Moon /><strong>7.4h</strong><span>Sleep</span></Card>
        <Card className="metric-card"><TrendingDown /><strong>104.2</strong><span>Weight</span></Card>
      </div>

      <Card>
        <p className="eyebrow">Progress</p>
        <h2 className="page-title">Weight Trend</h2>
        <div className="fake-chart"></div>
      </Card>
    </div>
  );
}

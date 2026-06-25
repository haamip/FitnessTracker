import { Dumbbell, Droplets, Flame, Moon, TrendingDown } from "lucide-react";
import Card from "../components/ui/Card";
import LineChartCard from "../components/LineChartCard";
import "./TrackFitScreens.css";

const weightData = [
  { date: "Mon", weight: 105.0 },
  { date: "Tue", weight: 104.8 },
  { date: "Wed", weight: 104.6 },
  { date: "Thu", weight: 104.5 },
  { date: "Fri", weight: 104.2 },
];

export default function Dashboard() {
  return (
    <div className="screen">
      <section className="screen-hero hero-premium">
        <p className="eyebrow">Good evening</p>
        <h1>Haami</h1>
        <p>Keep turning up. That is where the magic is.</p>

        <div className="goal-panel">
          <div>
            <span>Current</span>
            <strong>104.2kg</strong>
          </div>
          <div>
            <span>Goal</span>
            <strong>95kg</strong>
          </div>
        </div>

        <div className="progress-line">
          <span style={{ width: "62%" }}></span>
        </div>
      </section>

      <Card>
        <p className="eyebrow">Today</p>
        <h2 className="page-title">Upper Strength</h2>
        <p className="page-subtitle">6 exercises · around 55 mins</p>
        <button className="primary-button primary-button-spaced">
          <Dumbbell size={18} /> Start Workout
        </button>
      </Card>

      <div className="metric-grid">
        <Card className="metric-card"><Flame /><strong>2,184</strong><span>Calories</span></Card>
        <Card className="metric-card"><Droplets /><strong>3.1L</strong><span>Water</span></Card>
        <Card className="metric-card"><Moon /><strong>7.4h</strong><span>Sleep</span></Card>
        <Card className="metric-card"><TrendingDown /><strong>104.2</strong><span>Weight</span></Card>
      </div>

      <LineChartCard
        title="Weight Trend"
        data={weightData}
        dataKey="weight"
        unit="kg"
      />
    </div>
  );
}
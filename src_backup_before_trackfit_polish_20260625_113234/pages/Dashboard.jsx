import {
  Dumbbell,
  Droplets,
  Flame,
  Moon,
  TrendingDown,
  Plus,
} from "lucide-react";
import Card from "../components/ui/Card";
import "./Dashboard.css";

export default function Dashboard() {
  return (
    <div className="dashboard-screen">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Good morning</p>
          <h1>Haami</h1>
          <span>Ready to get stronger today?</span>
        </div>

        <button className="hero-button">
          <Plus size={20} />
        </button>
      </section>

      <Card className="today-workout-card">
        <div>
          <p className="eyebrow">Today&apos;s workout</p>
          <h2>Upper Body</h2>
          <span>Chest, back, shoulders</span>
        </div>

        <button className="start-button">
          Start
          <Dumbbell size={18} />
        </button>
      </Card>

      <div className="stats-grid">
        <Card>
          <Flame size={22} />
          <strong>2,184</strong>
          <span>Calories</span>
        </Card>

        <Card>
          <Droplets size={22} />
          <strong>3.1L</strong>
          <span>Water</span>
        </Card>

        <Card>
          <Moon size={22} />
          <strong>7.4h</strong>
          <span>Sleep</span>
        </Card>

        <Card>
          <TrendingDown size={22} />
          <strong>104.2</strong>
          <span>Weight</span>
        </Card>
      </div>

      <Card className="chart-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Progress</p>
            <h2>Weight trend</h2>
          </div>
          <span>-0.6kg</span>
        </div>

        <div className="fake-chart">
          <span></span>
        </div>
      </Card>
    </div>
  );
}

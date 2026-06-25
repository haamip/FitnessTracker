import { Dumbbell, Droplets, Flame, Moon, TrendingDown } from "lucide-react";
import Card from "../components/ui/Card";
import MetricCard from "../components/ui/MetricCard";
import PageHero from "../components/ui/PageHero";
import ProgressBar from "../components/ui/ProgressBar";
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
      <PageHero eyebrow="Good evening" title="Haami" premium>
        Keep turning up. That is where the magic is.
      </PageHero>

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

      <ProgressBar value={62} />

      <Card>
        <p className="eyebrow">Today</p>
        <h2 className="page-title">Upper Strength</h2>
        <p className="page-subtitle">6 exercises · around 55 mins</p>
        <button className="primary-button primary-button-spaced">
          <Dumbbell size={18} /> Start Workout
        </button>
      </Card>

      <div className="metric-grid">
        <MetricCard icon={Flame} value="2,184" label="Calories" />
        <MetricCard icon={Droplets} value="3.1L" label="Water" />
        <MetricCard icon={Moon} value="7.4h" label="Sleep" />
        <MetricCard icon={TrendingDown} value="104.2" label="Weight" />
      </div>

      <LineChartCard title="Weight Trend" data={weightData} dataKey="weight" unit="kg" />
    </div>
  );
}
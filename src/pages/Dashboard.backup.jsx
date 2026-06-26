import { Dumbbell, Droplets, Flame, Moon, TrendingDown } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import MetricCard from "../components/ui/MetricCard";
import PageHero from "../components/ui/PageHero";
import ProgressRing from "../components/ui/ProgressRing";
import SectionHeader from "../components/ui/SectionHeader";
import AchievementCard from "../components/ui/AchievementCard";
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
      <PageHero
        eyebrow="Good evening"
        title="Haami"
        premium
        right={<ProgressRing value={62} label="Goal" />}
      >
        Keep turning up. That is where the magic is.
      </PageHero>

      <div className="goal-panel goal-panel-floating">
        <div><span>Current</span><strong>104.2kg</strong></div>
        <div><span>Goal</span><strong>95kg</strong></div>
      </div>

      <Card className="today-card">
        <div>
          <p className="eyebrow">Today</p>
          <h2 className="page-title">Upper Strength</h2>
          <p className="page-subtitle">6 exercises · around 55 mins</p>
        </div>
        <Button><Dumbbell size={18} /> Start</Button>
      </Card>

      <SectionHeader eyebrow="Daily targets" title="Today so far" />

      <div className="metric-grid">
        <MetricCard icon={Flame} value="2,184" label="Calories" />
        <MetricCard icon={Droplets} value="3.1L" label="Water" />
        <MetricCard icon={Moon} value="7.4h" label="Sleep" />
        <MetricCard icon={TrendingDown} value="104.2" label="Weight" />
      </div>

      <LineChartCard title="Weight Trend" data={weightData} dataKey="weight" unit="kg" />

      <SectionHeader eyebrow="Wins" title="Achievements" />

      <div className="achievement-grid">
        <AchievementCard emoji="🔥" title="12 day streak" detail="Still showing up." />
        <AchievementCard emoji="💪" title="4 sessions" detail="This week locked in." />
      </div>
    </div>
  );
}
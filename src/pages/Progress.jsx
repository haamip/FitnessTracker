import { Activity, Scale, TrendingUp, Trophy } from "lucide-react";
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

const volumeData = [
  { date: "Mon", volume: 7200 },
  { date: "Tue", volume: 7600 },
  { date: "Wed", volume: 7350 },
  { date: "Thu", volume: 8100 },
  { date: "Fri", volume: 8240 },
];

export default function Progress() {
  return (
    <div className="screen">
      <section className="screen-hero">
        <p className="eyebrow">Analytics</p>
        <h1>Progress</h1>
        <p>Simple trends. No clutter.</p>
      </section>

      <div className="metric-grid">
        <Card className="metric-card"><Scale /><strong>104.2</strong><span>Current kg</span></Card>
        <Card className="metric-card"><TrendingUp /><strong>-0.6</strong><span>This week</span></Card>
        <Card className="metric-card"><Activity /><strong>4</strong><span>Sessions</span></Card>
        <Card className="metric-card"><Trophy /><strong>3</strong><span>PBs</span></Card>
      </div>

      <LineChartCard title="Weight Trend" data={weightData} dataKey="weight" unit="kg" />
      <LineChartCard title="Volume Trend" data={volumeData} dataKey="volume" unit="kg" />
    </div>
  );
}
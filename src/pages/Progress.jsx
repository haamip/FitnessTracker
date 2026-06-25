import { Activity, Scale, TrendingUp, Trophy } from "lucide-react";
import MetricCard from "../components/ui/MetricCard";
import PageHero from "../components/ui/PageHero";
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
      <PageHero eyebrow="Analytics" title="Progress">
        Simple trends. No clutter.
      </PageHero>

      <div className="metric-grid">
        <MetricCard icon={Scale} value="104.2" label="Current kg" />
        <MetricCard icon={TrendingUp} value="-0.6" label="This week" />
        <MetricCard icon={Activity} value="4" label="Sessions" />
        <MetricCard icon={Trophy} value="3" label="PBs" />
      </div>

      <LineChartCard title="Weight Trend" data={weightData} dataKey="weight" unit="kg" />
      <LineChartCard title="Volume Trend" data={volumeData} dataKey="volume" unit="kg" />
    </div>
  );
}
import { Bike, Footprints, HeartPulse, Plus, Timer } from "lucide-react";
import Button from "../components/ui/Button";
import MetricCard from "../components/ui/MetricCard";
import PageHero from "../components/ui/PageHero";
import LineChartCard from "../components/LineChartCard";
import "./TrackFitScreens.css";

const cardio = [
  ["Walk", "30 min · 3.2km", Footprints],
  ["Bike", "22 min · 8.4km", Bike],
  ["Zone 2", "40 min · steady", HeartPulse],
];

const cardioData = [
  { date: "Mon", minutes: 20 },
  { date: "Tue", minutes: 0 },
  { date: "Wed", minutes: 30 },
  { date: "Thu", minutes: 22 },
  { date: "Fri", minutes: 40 },
];

export default function CardioLog() {
  return (
    <div className="screen">
      <PageHero eyebrow="Conditioning" title="Cardio" premium>
        Log the work. Watch the engine grow.
      </PageHero>

      <Button><Plus size={18} /> Add Cardio</Button>

      <div className="metric-grid">
        <MetricCard icon={Timer} value="112" label="Minutes" />
        <MetricCard icon={HeartPulse} value="4" label="Sessions" />
      </div>

      <LineChartCard title="Cardio Minutes" data={cardioData} dataKey="minutes" unit=" min" />

      <div className="list-stack">
        {cardio.map(([name, detail, Icon]) => (
          <div className="list-card" key={name}>
            <div className="list-card-main">
              <div className="icon-bubble"><Icon /></div>
              <div><h3>{name}</h3><p>{detail}</p></div>
            </div>
            <span className="pill">Done</span>
          </div>
        ))}
      </div>
    </div>
  );
}
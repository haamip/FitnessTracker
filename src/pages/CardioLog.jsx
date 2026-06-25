import { Bike, Footprints, HeartPulse, Plus, Timer } from "lucide-react";
import Card from "../components/ui/Card";
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
      <section className="screen-hero hero-premium">
        <p className="eyebrow">Conditioning</p>
        <h1>Cardio</h1>
        <p>Log the work. Watch the engine grow.</p>
      </section>

      <button className="primary-button"><Plus size={18} /> Add Cardio</button>

      <div className="metric-grid">
        <Card className="metric-card"><Timer /><strong>112</strong><span>Minutes</span></Card>
        <Card className="metric-card"><HeartPulse /><strong>4</strong><span>Sessions</span></Card>
      </div>

      <LineChartCard title="Cardio Minutes" data={cardioData} dataKey="minutes" unit=" min" />

      <div className="list-stack">
        {cardio.map(([name, detail, Icon]) => (
          <div className="list-card" key={name}>
            <div className="list-card-main">
              <div className="icon-bubble"><Icon /></div>
              <div>
                <h3>{name}</h3>
                <p>{detail}</p>
              </div>
            </div>
            <span className="pill">Done</span>
          </div>
        ))}
      </div>
    </div>
  );
}
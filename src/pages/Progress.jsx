import { Activity, Scale, TrendingUp, Trophy } from "lucide-react";
import Card from "../components/ui/Card";
import "./TrackFitScreens.css";

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

      <Card>
        <p className="eyebrow">Weight</p>
        <h2 className="page-title">Trend line</h2>
        <div className="fake-chart"></div>
      </Card>

      <Card>
        <p className="eyebrow">Strength</p>
        <h2 className="page-title">Volume trend</h2>
        <div className="fake-chart"></div>
      </Card>
    </div>
  );
}


import { Droplets, Moon, Smile, Utensils } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import MetricCard from "../components/ui/MetricCard";
import PageHero from "../components/ui/PageHero";
import ProgressBar from "../components/ui/ProgressBar";
import "./TrackFitScreens.css";

export default function DailyCheckIn() {
  return (
    <div className="screen">
      <PageHero eyebrow="Daily reset" title="Check In" premium>
        Keep it honest. Keep it simple.
      </PageHero>

      <Card>
        <p className="eyebrow">Protein target</p>
        <h2 className="page-title">148 / 185g</h2>
        <ProgressBar value={80} dark />
      </Card>

      <div className="metric-grid">
        <MetricCard icon={Droplets} value="3.1L" label="Water" />
        <MetricCard icon={Moon} value="7.4h" label="Sleep" />
        <MetricCard icon={Utensils} value="2,184" label="Calories" />
        <MetricCard icon={Smile} value="Good" label="Mood" />
      </div>

      <div className="form-card">
        <label>Today&apos;s note</label>
        <textarea rows="4" placeholder="How did training and food go?"></textarea>
        <Button className="primary-button-spaced">Save Check In</Button>
      </div>
    </div>
  );
}
import { Brain, ChevronRight, Dumbbell, Flame, TrendingUp } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import MetricCard from "../components/ui/MetricCard";
import PageHero from "../components/ui/PageHero";
import SectionHeader from "../components/ui/SectionHeader";
import "./TrackFitScreens.css";

const suggestions = [
  "Increase bench press by 2.5kg next upper session.",
  "Keep protein above 180g tomorrow.",
  "Add 20 minutes easy Zone 2 cardio this week.",
];

export default function Coach() {
  return (
    <div className="screen">
      <PageHero eyebrow="AI Coach" title="Coach" premium>
        Smart feedback after every session.
      </PageHero>

      <Card className="coach-card">
        <div className="coach-icon">
          <Brain size={28} />
        </div>
        <h2 className="page-title">Nice work today.</h2>
        <p className="page-subtitle">
          Your weekly training volume is up 8%. Recovery looks solid, so next session we can push carefully.
        </p>
      </Card>

      <div className="metric-grid">
        <MetricCard icon={TrendingUp} value="+8%" label="Volume" />
        <MetricCard icon={Dumbbell} value="+2.5kg" label="Bench" />
        <MetricCard icon={Flame} value="12" label="Streak" />
      </div>

      <SectionHeader eyebrow="Next best moves" title="Recommendations" />

      <div className="list-stack">
        {suggestions.map((item) => (
          <div className="list-card" key={item}>
            <div className="list-card-main">
              <div className="icon-bubble">
                <Brain size={18} />
              </div>
              <div>
                <h3>{item}</h3>
                <p>Coach recommendation</p>
              </div>
            </div>
            <ChevronRight size={18} />
          </div>
        ))}
      </div>

      <Button>Generate Next Plan</Button>
    </div>
  );
}
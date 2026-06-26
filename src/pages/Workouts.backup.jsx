import { Dumbbell, Timer } from "lucide-react";
import Button from "../components/ui/Button";
import PageHero from "../components/ui/PageHero";
import SectionHeader from "../components/ui/SectionHeader";
import WorkoutCard from "../components/ui/WorkoutCard";
import "./TrackFitScreens.css";

const workouts = [
  { id: "upper", name: "Upper Strength", detail: "Chest, back, shoulders", tag: "Today", time: "55 min" },
  { id: "lower", name: "Lower Strength", detail: "Quads, hamstrings, glutes", tag: "Next", time: "50 min" },
  { id: "full", name: "Full Body", detail: "Strength and conditioning", tag: "Build", time: "45 min" },
];

export default function Workouts() {
  return (
    <div className="screen">
      <PageHero eyebrow="Training" title="Workouts" premium>
        Pick a session and get moving.
      </PageHero>

      <div className="action-row">
        <button className="action-card"><Dumbbell /><strong>Start</strong><span>Quick lift</span></button>
        <button className="action-card"><Timer /><strong>Timer</strong><span>Rest clock</span></button>
      </div>

      <SectionHeader eyebrow="Plan" title="Your sessions" action={<Button variant="ghost">Edit</Button>} />

      <div className="list-stack">
        {workouts.map((workout) => (
          <WorkoutCard
            key={workout.id}
            to={`/workouts/${workout.id}`}
            name={workout.name}
            detail={workout.detail}
            tag={workout.tag}
            time={workout.time}
          />
        ))}
      </div>
    </div>
  );
}
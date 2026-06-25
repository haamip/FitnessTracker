import { Check, Dumbbell, Timer } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import PageHero from "../components/ui/PageHero";
import ExerciseCard from "../components/ui/ExerciseCard";
import "./TrackFitScreens.css";

const exercises = [
  { name: "Bench Press", target: "70kg x 8", sets: ["Set 1", "Set 2", "Set 3", "Set 4"] },
  { name: "Lat Pulldown", target: "65kg x 10", sets: ["Set 1", "Set 2", "Set 3", "Set 4"] },
  { name: "Shoulder Press", target: "28kg x 8", sets: ["Set 1", "Set 2", "Set 3"] },
];

export default function WorkoutDetail() {
  return (
    <div className="screen workout-mode">
      <PageHero eyebrow="Active workout" title="Upper Strength" premium>
        Beat last week. Keep form clean.
      </PageHero>

      <div className="action-row">
        <button className="action-card"><Timer /><strong>01:24</strong><span>Rest timer</span></button>
        <button className="action-card"><Dumbbell /><strong>8,240kg</strong><span>Volume</span></button>
      </div>

      <Card className="current-exercise-card">
        <p className="eyebrow">Current exercise</p>
        <h2 className="page-title">Bench Press</h2>
        <p className="page-subtitle">70kg · 8 reps · 4 working sets</p>
        <Button className="primary-button-spaced"><Check size={18} /> Complete Set</Button>
      </Card>

      <div className="list-stack">
        {exercises.map((exercise) => (
          <ExerciseCard key={exercise.name} {...exercise} />
        ))}
      </div>

      <button className="finish-button">Finish Workout</button>
    </div>
  );
}
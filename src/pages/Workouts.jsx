import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronRight, Dumbbell, Plus, Sparkles } from "lucide-react";
import "./TrackFitScreens.css";

const workoutPlans = [
  {
    id: "workout-1",
    name: "Workout 1",
    detail: "Full body strength session",
    exercises: "5 exercises",
    sets: "12 sets",
  },
  {
    id: "upper",
    name: "Upper Strength",
    detail: "Chest, back, shoulders and arms",
    exercises: "6 exercises",
    sets: "18 sets",
  },
  {
    id: "lower",
    name: "Lower Strength",
    detail: "Quads, hamstrings, glutes and core",
    exercises: "6 exercises",
    sets: "18 sets",
  },
];

function getSavedAiPlan() {
  const savedPlan = localStorage.getItem("trackfit_ai_workout_plan");

  if (!savedPlan) {
    return [];
  }

  try {
    return JSON.parse(savedPlan);
  } catch {
    return [];
  }
}

export default function Workouts() {
  const savedAiPlan = useMemo(() => getSavedAiPlan(), []);

  return (
    <motion.div
      className="screen tf-workouts-page"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <section className="tf-page-head">
        <p>Training</p>
        <h1>Workouts</h1>
        <span>Build, save and log your sessions.</span>
      </section>

      <Link className="tf-builder-card" to="/workouts/builder">
        <div>
          <Sparkles size={22} />
          <strong>AI Workout Builder</strong>
          <span>Build a program from the exercise library</span>
        </div>
        <ChevronRight size={22} />
      </Link>

      {savedAiPlan.length > 0 && (
        <section className="tf-workout-stack">
          <div className="tf-section-label">Saved AI Program</div>

          {savedAiPlan.map((day) => (
            <Link className="tf-plan-card" to={`/workouts/${day.id}`} key={day.id}>
              <div className="tf-plan-icon">
                <Sparkles size={22} />
              </div>

              <div>
                <h2>{day.name}</h2>
                <p>{day.exercises.length} exercises • {day.time} mins</p>
                <span>{day.focus} • {day.equipment}</span>
              </div>

              <ChevronRight className="tf-plan-arrow" size={22} />
            </Link>
          ))}
        </section>
      )}

      <section className="tf-workout-stack">
        <div className="tf-section-label">Quick Start</div>

        {workoutPlans.map((plan) => (
          <Link className="tf-plan-card" to={`/workouts/${plan.id}`} key={plan.id}>
            <div className="tf-plan-icon">
              <Dumbbell size={22} />
            </div>

            <div>
              <h2>{plan.name}</h2>
              <p>{plan.detail}</p>
              <span>{plan.exercises} • {plan.sets}</span>
            </div>

            <ChevronRight className="tf-plan-arrow" size={22} />
          </Link>
        ))}

        <Link className="tf-add-exercise-card" to="/workouts/workout-1">
          <Plus size={20} />
          Start Empty Workout
        </Link>
      </section>
    </motion.div>
  );
}

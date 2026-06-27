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

export default function Workouts() {
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
        <span>Pick a session and log it properly.</span>
      </section>

      <Link className="tf-builder-card" to="/workouts/workout-1">
        <div>
          <Sparkles size={22} />
          <strong>Start Workout</strong>
          <span>Clean gym-mode layout</span>
        </div>
        <ChevronRight size={22} />
      </Link>

      <section className="tf-workout-stack">
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

        <button className="tf-add-exercise-card" type="button">
          <Plus size={20} />
          Add Workout
        </button>
      </section>
    </motion.div>
  );
}
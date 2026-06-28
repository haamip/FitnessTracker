import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronRight, Dumbbell, History, Plus, Sparkles } from "lucide-react";
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

function readJson(key, fallback) {
  const saved = localStorage.getItem(key);

  if (!saved) {
    return fallback;
  }

  try {
    return JSON.parse(saved);
  } catch {
    return fallback;
  }
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function Workouts() {
  const savedAiPlan = useMemo(() => readJson("trackfit_ai_workout_plan", []), []);
  const workoutHistory = useMemo(() => readJson("trackfit_workout_history", []).slice(0, 3), []);

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

      {workoutHistory.length > 0 && (
        <section className="tf-workout-stack">
          <div className="tf-section-label">Recent History</div>

          {workoutHistory.map((workout) => (
            <article className="tf-history-card" key={workout.id}>
              <div className="tf-plan-icon">
                <History size={21} />
              </div>

              <div>
                <h2>{workout.title}</h2>
                <p>{formatDate(workout.completedAt)}</p>
                <span>
                  {workout.completedSets}/{workout.totalSets} sets • {Math.round(workout.volume)} kg • {Math.round(workout.durationSeconds / 60)} min
                </span>
              </div>
            </article>
          ))}
        </section>
      )}
    </motion.div>
  );
}

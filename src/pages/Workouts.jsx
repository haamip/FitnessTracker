import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronRight, Clock3, Dumbbell, Flame, History, Plus, Sparkles } from "lucide-react";
import "./TrackFitScreens.css";

const starterPlans = [
  {
    id: "workout-1",
    name: "Workout 1",
    detail: "Full body strength session",
    exercises: "5 exercises",
    sets: "12 sets",
    time: "45 min",
    progress: 18,
  },
  {
    id: "upper",
    name: "Upper Strength",
    detail: "Chest, back, shoulders and arms",
    exercises: "6 exercises",
    sets: "18 sets",
    time: "60 min",
    progress: 0,
  },
  {
    id: "lower",
    name: "Lower Strength",
    detail: "Quads, hamstrings, glutes and core",
    exercises: "6 exercises",
    sets: "18 sets",
    time: "60 min",
    progress: 0,
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
  const savedTrainingPlan = useMemo(() => readJson("trackfit_ai_workout_plan", []), []);
  const workoutHistory = useMemo(() => readJson("trackfit_workout_history", []).slice(0, 3), []);
  const hasTrainingPlan = savedTrainingPlan.length > 0;

  const visiblePlans = hasTrainingPlan
    ? savedTrainingPlan.map((day) => ({
        id: day.id,
        name: day.name,
        detail: `${day.focus} • ${day.equipment}`,
        exercises: `${day.exercises.length} exercises`,
        sets: `${day.exercises.reduce((total, exercise) => total + Number(exercise.sets || 0), 0)} sets`,
        time: `${day.time} min`,
        progress: 0,
        generated: true,
      }))
    : starterPlans;

  return (
    <motion.div
      className="screen workouts-v4"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <section className="v4-workout-hero">
        <div>
          <p className="eyebrow">Training</p>
          <h1>Workouts</h1>
          <p>Build, save and log clean training sessions without the clutter.</p>
        </div>

        <span className="v4-hero-badge">
          <Flame size={15} />
          {hasTrainingPlan ? "Plan active" : "Quick start"}
        </span>
      </section>

      <section className="v4-quick-grid">
        <Link className="v4-quick-card" to="/workouts/builder">
          <Sparkles size={24} />
          <strong>Workout Builder</strong>
          <span>{hasTrainingPlan ? "Edit or rebuild plan" : "Create a smart plan"}</span>
        </Link>

        <Link className="v4-quick-card" to="/workouts/workout-1">
          <Plus size={24} />
          <strong>Empty Workout</strong>
          <span>Start fresh and add exercises</span>
        </Link>
      </section>

      <section className="v4-workout-list">
        <div className="v4-section-heading">
          <div>
            <p className="eyebrow">{hasTrainingPlan ? "Generated Plan" : "Starter Templates"}</p>
            <h2>{hasTrainingPlan ? "Your training plan" : "Choose a workout"}</h2>
          </div>
          <span>{visiblePlans.length} options</span>
        </div>

        {visiblePlans.map((plan) => (
          <Link className="v4-workout-card" to={`/workouts/${plan.id}`} key={plan.id}>
            <div className="v4-workout-card__top">
              <span className="v4-chip">{plan.generated ? "Smart Plan" : "Template"}</span>
              <span className="v4-time">{plan.time}</span>
            </div>

            <div className="v4-workout-card__body">
              <div className="v4-workout-icon">
                {plan.generated ? <Sparkles size={22} /> : <Dumbbell size={22} />}
              </div>

              <div>
                <h3>{plan.name}</h3>
                <p>{plan.detail}</p>
              </div>

              <ChevronRight className="v4-chevron" size={22} />
            </div>

            <div className="v4-workout-card__footer">
              <span>
                <Dumbbell size={15} />
                {plan.exercises} • {plan.sets}
              </span>

              <div className="v4-workout-progress">
                <i style={{ width: `${plan.progress}%` }} />
              </div>
            </div>
          </Link>
        ))}
      </section>

      {workoutHistory.length > 0 && (
        <section className="v4-workout-list">
          <div className="v4-section-heading">
            <div>
              <p className="eyebrow">Recent</p>
              <h2>Workout history</h2>
            </div>
            <span>{workoutHistory.length}</span>
          </div>

          {workoutHistory.map((workout) => (
            <article className="v4-workout-card" key={workout.id}>
              <div className="v4-workout-card__body">
                <div className="v4-workout-icon">
                  <History size={22} />
                </div>

                <div>
                  <h3>{workout.title}</h3>
                  <p>{formatDate(workout.completedAt)}</p>
                </div>
              </div>

              <div className="v4-workout-card__footer">
                <span>
                  <Clock3 size={15} />
                  {workout.completedSets}/{workout.totalSets} sets • {Math.round(workout.volume)} kg
                </span>

                <span>{workout.prs?.length || 0} PRs</span>
              </div>
            </article>
          ))}
        </section>
      )}
    </motion.div>
  );
}
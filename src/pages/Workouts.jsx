import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronRight, Clock3, Dumbbell, Flame, History, Plus, Sparkles } from "lucide-react";
import { AIPlanRepository, HistoryRepository } from "../services/trackfitDataLayer";
import "./TrackFitScreens.css";
import "../styles/TrackFitWorkoutFixes.css";

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

function formatDate(value) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function countPlanSets(exercises = []) {
  return exercises.reduce((total, exercise) => total + Number(exercise.sets || 0), 0);
}

function mapPlanDayToWorkoutCard(day) {
  const exercises = day.exercises || [];

  return {
    id: day.id,
    name: day.name,
    detail: `${day.focus || "Training"} - ${day.equipment || "Equipment"}`,
    exercises: `${exercises.length} exercises`,
    sets: `${countPlanSets(exercises)} sets`,
    time: `${day.time || 45} min`,
    progress: 0,
    generated: true,
  };
}

export default function Workouts() {
  const [searchParams] = useSearchParams();
  const refreshToken = searchParams.get("refresh") || "initial";

  /**
   * Read workout overview data through repositories only.
   *
   * The refresh query is used by developer tools after seeding/clearing demo
   * data so the screen can rebuild its snapshot without direct storage access.
   */
  const dataSnapshot = useMemo(
    () => ({
      savedTrainingPlan: AIPlanRepository.getPlan(),
      workoutHistory: HistoryRepository.getRecent(6),
    }),
    [refreshToken],
  );

  const savedTrainingPlan = dataSnapshot.savedTrainingPlan;
  const workoutHistory = dataSnapshot.workoutHistory;
  const hasTrainingPlan = savedTrainingPlan.length > 0;

  const visiblePlans = hasTrainingPlan ? savedTrainingPlan.map(mapPlanDayToWorkoutCard) : starterPlans;

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
            <p className="eyebrow">{hasTrainingPlan ? "Smart Plan" : "Starter Templates"}</p>
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
                {plan.exercises} - {plan.sets}
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
            <Link
              className="v4-workout-card completed-workout-card"
              to={`/workouts/history/${workout.id}`}
              key={workout.id}
            >
              <div className="v4-workout-card__body">
                <div className="v4-workout-icon">
                  <History size={22} />
                </div>

                <div>
                  <h3>{workout.title || "Completed workout"}</h3>
                  <p>{workout.completedAt ? formatDate(workout.completedAt) : "No timestamp"}</p>
                </div>
              </div>

              <div className="v4-workout-card__footer">
                <span>
                  <Clock3 size={15} />
                  {workout.completedSets || 0}/{workout.totalSets || 0} sets - {Math.round(workout.volume || 0)} kg
                </span>

                <span>{workout.prs?.length || 0} PRs</span>
              </div>
            </Link>
          ))}
        </section>
      )}
    </motion.div>
  );
}

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import {
  ChevronRight,
  Dumbbell,
  History,
  Plus,
  Sparkles,
} from "lucide-react";
import {
  AIPlanRepository,
  HistoryRepository,
} from "../services/repositories/trackfitDataLayer";
import "./TrackFitScreens.css";
import "../styles/TrackFitWorkoutFixes.css";

const starterPlans = [
  {
    id: "workout-1",
    name: "Workout 1",
    detail: "Full body strength session",
  },
  {
    id: "upper",
    name: "Upper Strength",
    detail: "Chest, back, shoulders and arms",
  },
  {
    id: "lower",
    name: "Lower Strength",
    detail: "Quads, hamstrings, glutes and core",
  },
];

function formatDate(value) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function mapPlanDayToWorkoutCard(day) {
  return {
    id: day.id,
    name: day.name,
    detail: day.focus || "Training session",
    generated: true,
  };
}

export default function Workouts() {
  const [searchParams] = useSearchParams();
  const refreshToken = searchParams.get("refresh") || "initial";

  const dataSnapshot = useMemo(() => {
    void refreshToken;

    return {
      savedTrainingPlan: AIPlanRepository.getPlan(),
      workoutHistory: HistoryRepository.getRecent(3),
    };
  }, [refreshToken]);

  const savedTrainingPlan = dataSnapshot.savedTrainingPlan;
  const workoutHistory = dataSnapshot.workoutHistory;
  const hasTrainingPlan = savedTrainingPlan.length > 0;

  const visiblePlans = hasTrainingPlan
    ? savedTrainingPlan.map(mapPlanDayToWorkoutCard)
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
          <p className="eyebrow">Train</p>
          <h1>Choose your workout</h1>
          <p>Start today&apos;s session or open one of your saved workouts.</p>
        </div>
      </section>

      <section className="v4-workout-list">
        <div className="v4-section-heading">
          <div>
            <p className="eyebrow">
              {hasTrainingPlan ? "Your plan" : "Quick start"}
            </p>
            <h2>{hasTrainingPlan ? "Training days" : "Workouts"}</h2>
          </div>
        </div>

        {visiblePlans.map((plan) => (
          <Link
            className="v4-workout-card"
            to={`/workouts/${plan.id}`}
            key={plan.id}
          >
            <div className="v4-workout-card__body">
              <div className="v4-workout-icon">
                {plan.generated ? (
                  <Sparkles size={22} />
                ) : (
                  <Dumbbell size={22} />
                )}
              </div>

              <div>
                <h3>{plan.name}</h3>
                <p>{plan.detail}</p>
              </div>

              <ChevronRight className="v4-chevron" size={22} />
            </div>
          </Link>
        ))}
      </section>

      <section className="v4-quick-grid">
        <Link className="v4-quick-card" to="/workouts/workout-1">
          <Plus size={24} />
          <strong>Empty Workout</strong>
          <span>Start a session from scratch</span>
        </Link>

        <Link className="v4-quick-card" to="/workouts/builder">
          <Sparkles size={24} />
          <strong>Manage Plan</strong>
          <span>{hasTrainingPlan ? "Edit your workouts" : "Build a plan"}</span>
        </Link>
      </section>

      {workoutHistory.length > 0 && (
        <section className="v4-workout-list">
          <div className="v4-section-heading">
            <div>
              <p className="eyebrow">Recent</p>
              <h2>Workout history</h2>
            </div>
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
                  <p>
                    {workout.completedAt
                      ? formatDate(workout.completedAt)
                      : "Completed session"}
                  </p>
                </div>

                <ChevronRight className="v4-chevron" size={22} />
              </div>
            </Link>
          ))}
        </section>
      )}
    </motion.div>
  );
}

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import {
  ChevronRight,
  Dumbbell,
  FileUp,
  History,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  AIPlanRepository,
  HistoryRepository,
  SavedWorkoutRepository,
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
  const [savedWorkouts, setSavedWorkouts] = useState(() =>
    SavedWorkoutRepository.getAll(),
  );

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

  function deleteSavedWorkout(workout) {
    const shouldDelete = window.confirm(`Delete “${workout.name}”?`);
    if (!shouldDelete) return;

    setSavedWorkouts(SavedWorkoutRepository.remove(workout.id));
  }

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

      {savedWorkouts.length > 0 && (
        <section className="v4-workout-list">
          <div className="v4-section-heading">
            <div>
              <p className="eyebrow">Saved</p>
              <h2>Your workouts</h2>
            </div>
          </div>

          {savedWorkouts.map((workout) => (
            <div className="v4-workout-card" key={workout.id}>
              <div className="v4-workout-card__body">
                <Link
                  to={`/workouts/${workout.id}`}
                  style={{ display: "contents", color: "inherit", textDecoration: "none" }}
                >
                  <div className="v4-workout-icon">
                    <Dumbbell size={22} />
                  </div>

                  <div>
                    <h3>{workout.name}</h3>
                    <p>{workout.detail || "Saved workout"}</p>
                  </div>

                  <ChevronRight className="v4-chevron" size={22} />
                </Link>

                <button
                  aria-label={`Delete ${workout.name}`}
                  onClick={() => deleteSavedWorkout(workout)}
                  type="button"
                  style={{
                    border: 0,
                    background: "transparent",
                    padding: 8,
                    cursor: "pointer",
                  }}
                >
                  <Trash2 size={19} />
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

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

        <Link className="v4-quick-card" to="/workouts/import">
          <FileUp size={24} />
          <strong>Import Workout</strong>
          <span>Paste text or upload a PDF</span>
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
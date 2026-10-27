import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckSquare,
  ChevronRight,
  Copy,
  Dumbbell,
  FileUp,
  History,
  Pencil,
  Plus,
  Sparkles,
  Square,
  Trash2,
  X,
} from "lucide-react";
import {
  AIPlanRepository,
  HistoryRepository,
  SavedWorkoutRepository,
  WorkoutRepository,
} from "../services/repositories/trackfitDataLayer";
import {
  STARTER_WORKOUTS,
  createPlanDayExercises,
  createStarterWorkoutExercises,
} from "../services/starterWorkouts";
import "./TrackFitScreens.css";
import "../styles/TrackFitWorkoutFixes.css";
import "./Workouts.css";

const HIDDEN_STARTERS_KEY = "trackfit_hidden_starter_workouts";

function readHiddenStarters() {
  try {
    const parsed = JSON.parse(localStorage.getItem(HIDDEN_STARTERS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-AU", { day: "2-digit", month: "short" }).format(new Date(value));
}

function freshCopy(exercises) {
  return exercises.map((exercise) => ({
    ...exercise,
    id: `${exercise.libraryId || "exercise"}-${crypto.randomUUID()}`,
    sets: (exercise.sets || []).map((set) => ({
      ...set,
      id: crypto.randomUUID(),
      done: false,
      rpe: "",
      rir: "",
      failure: false,
      note: "",
    })),
  }));
}

export default function Workouts() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refreshToken = searchParams.get("refresh") || "initial";
  const [savedWorkouts, setSavedWorkouts] = useState(() => SavedWorkoutRepository.getAll());
  const [trainingDays, setTrainingDays] = useState(() => AIPlanRepository.getPlan());
  const [hiddenStarterIds, setHiddenStarterIds] = useState(readHiddenStarters);
  const [selectMode, setSelectMode] = useState(false);
  const [historyRevision, setHistoryRevision] = useState(0);
  const [legacyHistoryCount, setLegacyHistoryCount] = useState(() => HistoryRepository.getLegacyCount());
  const [selectedIds, setSelectedIds] = useState([]);

  const workoutHistory = useMemo(() => {
    void refreshToken;
    return HistoryRepository.getRecent(3);
  }, [refreshToken, historyRevision]);

  const hasTrainingPlan = trainingDays.length > 0;
  const planCards = hasTrainingPlan
    ? trainingDays.map((day) => ({
        id: day.id,
        name: day.name,
        detail: day.focus || "Training session",
        kind: "plan",
        data: day,
      }))
    : STARTER_WORKOUTS
        .filter((starter) => !hiddenStarterIds.includes(starter.id))
        .map((starter) => ({ ...starter, kind: "starter" }));

  const allWorkouts = [
    ...savedWorkouts.map((workout) => ({ ...workout, kind: "saved" })),
    ...planCards.filter((plan) => !savedWorkouts.some((saved) => saved.id === plan.id)),
  ];

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds([]);
  }

  function toggleSelected(workoutId) {
    setSelectedIds((current) =>
      current.includes(workoutId)
        ? current.filter((id) => id !== workoutId)
        : [...current, workoutId],
    );
  }

  function removeWorkout(workout) {
    if (workout.kind === "saved") {
      setSavedWorkouts(SavedWorkoutRepository.remove(workout.id));
    } else if (workout.kind === "plan") {
      const updated = trainingDays.filter((day) => day.id !== workout.id);
      if (updated.length) AIPlanRepository.savePlan(updated);
      else AIPlanRepository.clear();
      WorkoutRepository.removeById(workout.id);
      setTrainingDays(updated);
    } else {
      const next = [...new Set([...hiddenStarterIds, workout.id])];
      localStorage.setItem(HIDDEN_STARTERS_KEY, JSON.stringify(next));
      setHiddenStarterIds(next);
    }
  }

  function deleteWorkout(workout) {
    const description = workout.kind === "starter"
      ? `Hide "${workout.name}" from your workout list? You can restore the starter workouts later.`
      : workout.kind === "plan"
        ? `Remove "${workout.name}" from your training plan?`
        : `Delete "${workout.name}"?`;
    if (!window.confirm(description)) return;
    removeWorkout(workout);
  }

  function deleteSelectedWorkouts() {
    const toDelete = allWorkouts.filter((workout) => selectedIds.includes(workout.id));
    if (!toDelete.length) return;
    if (!window.confirm(`Remove ${toDelete.length} selected workout${toDelete.length === 1 ? "" : "s"}? Starter workouts can be restored later.`)) return;
    toDelete.forEach(removeWorkout);
    exitSelectMode();
  }

  function sourceExercises(workout) {
    if (workout.kind === "saved") return workout.exercises || [];
    const active = WorkoutRepository.getById(workout.id);
    if (active?.length) return active;
    if (workout.kind === "plan") return createPlanDayExercises(workout.data);
    return createStarterWorkoutExercises(workout.id);
  }

  function copyWorkout(workout, shouldEdit = false) {
    const exercises = freshCopy(sourceExercises(workout));
    const id = `saved-${crypto.randomUUID()}`;
    const copy = {
      id,
      name: shouldEdit ? workout.name : `${workout.name} (copy)`,
      detail: `${exercises.length} exercises`,
      exercises,
    };
    setSavedWorkouts(SavedWorkoutRepository.save(copy));
    if (shouldEdit) navigate(`/workouts/create?edit=${encodeURIComponent(id)}`);
  }

  function editWorkout(workout) {
    if (workout.kind === "saved") {
      navigate(`/workouts/create?edit=${encodeURIComponent(workout.id)}`);
    } else {
      // Starter and generated plan workouts remain intact while a new editable copy is saved.
      copyWorkout(workout, true);
    }
  }

  function restoreLegacyHistory() {
    if (!window.confirm("These workout records were saved on this device before TrackFit separated accounts. Only restore them if they belong to your signed-in account. Restore and back them up to the cloud?")) return;
    const count = HistoryRepository.importLegacyForCurrentUser();
    setLegacyHistoryCount(0);
    if (count) setHistoryRevision((value) => value + 1);
  }

  function restoreStarters() {
    localStorage.removeItem(HIDDEN_STARTERS_KEY);
    setHiddenStarterIds([]);
  }

  return (
    <motion.div
      className="screen workouts-v4 tf-workout-list-page"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <section className="v4-workout-hero">
        <div>
          <p className="eyebrow">Train</p>
          <h1>Choose your workout</h1>
          <p>Open a workout to train, or edit and save your own version.</p>
        </div>
      </section>

      <section className="v4-workout-list">
        <div className="v4-section-heading tf-workouts-heading">
          <div>
            <p className="eyebrow">All workouts</p>
            <h2>Your workouts</h2>
          </div>
          <button
            type="button"
            onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
            className="tf-workout-select"
          >
            {selectMode ? <X size={18} /> : <CheckSquare size={18} />}
            {selectMode ? "Cancel" : "Select"}
          </button>
        </div>

        {selectMode && (
          <div className="tf-workout-bulk-actions">
            <span>{selectedIds.length} selected</span>
            <button
              type="button"
              disabled={!selectedIds.length}
              onClick={deleteSelectedWorkouts}
            >
              <Trash2 size={17} /> Delete selected
            </button>
          </div>
        )}

        {allWorkouts.length === 0 && (
          <p>No workouts here yet. Build or import one below.</p>
        )}

        {allWorkouts.map((workout) => {
          const selected = selectedIds.includes(workout.id);
          return (
            <article className="v4-workout-card tf-workout-card" key={workout.id}>
              {selectMode ? (
                <button
                  className="tf-workout-card__main tf-workout-card__select"
                  type="button"
                  onClick={() => toggleSelected(workout.id)}
                  aria-label={`${selected ? "Deselect" : "Select"} ${workout.name}`}
                  aria-pressed={selected}
                >
                  <span className="v4-workout-icon">
                    {selected ? <CheckSquare size={22} /> : <Square size={22} />}
                  </span>
                  <span className="tf-workout-card__text">
                    <strong>{workout.name}</strong>
                    <small>{workout.detail || "Saved workout"}</small>
                  </span>
                </button>
              ) : (
                <>
                  <Link className="tf-workout-card__main" to={`/workouts/${workout.id}`}>
                    <span className="v4-workout-icon">
                      {workout.kind === "plan" ? <Sparkles size={22} /> : <Dumbbell size={22} />}
                    </span>
                    <span className="tf-workout-card__text">
                      <strong>{workout.name}</strong>
                      <small>{workout.detail || "Saved workout"}</small>
                    </span>
                    <ChevronRight className="tf-workout-card__chevron" size={22} aria-hidden="true" />
                  </Link>
                  <div className="tf-workout-card__actions" aria-label={`Actions for ${workout.name}`}>
                    <button type="button" onClick={() => editWorkout(workout)} aria-label={`Edit ${workout.name}`}>
                      <Pencil size={19} aria-hidden="true" /> <span>Edit</span>
                    </button>
                    <button type="button" onClick={() => copyWorkout(workout)} aria-label={`Duplicate ${workout.name}`}>
                      <Copy size={19} aria-hidden="true" /> <span>Duplicate</span>
                    </button>
                    <button type="button" onClick={() => deleteWorkout(workout)} aria-label={`Delete ${workout.name}`}>
                      <Trash2 size={19} aria-hidden="true" /> <span>Delete</span>
                    </button>
                  </div>
                </>
              )}
            </article>
          );
        })}

        {!hasTrainingPlan && hiddenStarterIds.length > 0 && (
          <button type="button" className="tf-workout-restore" onClick={restoreStarters}>
            Restore starter workouts
          </button>
        )}
      </section>

      <section className="v4-quick-grid">
        <Link className="v4-quick-card" to="/workouts/create">
          <Plus size={24} /><strong>Build a Workout</strong><span>Choose exercises, name and save your routine</span>
        </Link>
        <Link className="v4-quick-card" to="/workouts/import">
          <FileUp size={24} /><strong>Import Workout</strong><span>Paste text or upload a PDF</span>
        </Link>
        <Link className="v4-quick-card" to="/workouts/builder">
          <Sparkles size={24} /><strong>Manage Plan</strong><span>{hasTrainingPlan ? "Edit your workouts" : "Build a plan"}</span>
        </Link>
      </section>

      {legacyHistoryCount > 0 && (
        <section className="form-card" style={{ display: "grid", gap: 10 }}>
          <strong>Old workout history found on this device</strong>
          <p style={{ margin: 0, lineHeight: 1.5 }}>There are {legacyHistoryCount} workout records saved before account-specific syncing. Only restore them if they're yours. They won't be assigned to your account automatically.</p>
          <button type="button" onClick={restoreLegacyHistory} className="tf-workout-restore">
            Restore my old workout history
          </button>
        </section>
      )}

      {workoutHistory.length > 0 && (
        <section className="v4-workout-list">
          <div className="v4-section-heading">
            <div><p className="eyebrow">Recent</p><h2>Workout history</h2></div>
          </div>
          {workoutHistory.map((workout) => (
            <Link className="v4-workout-card completed-workout-card" to={`/workouts/history/${workout.id}`} key={workout.id}>
              <div className="v4-workout-card__body">
                <div className="v4-workout-icon"><History size={22} /></div>
                <div>
                  <h3>{workout.title || "Completed workout"}</h3>
                  <p>{workout.completedAt ? formatDate(workout.completedAt) : "Completed session"}</p>
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

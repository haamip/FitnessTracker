import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  CheckSquare,
  ChevronRight,
  Copy,
  FileUp,
  Pencil,
  Plus,
  Sparkles,
  Square,
  Trash2,
  X,
} from "lucide-react";
import {
  SavedWorkoutRepository,
  WorkoutRepository,
} from "../services/repositories/trackfitDataLayer";
import {
  STARTER_WORKOUTS,
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
  const [savedWorkouts, setSavedWorkouts] = useState(() => SavedWorkoutRepository.getAll());
  const [hiddenStarterIds, setHiddenStarterIds] = useState(readHiddenStarters);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(8);

  const starterCards = STARTER_WORKOUTS
    .filter(starter => !hiddenStarterIds.includes(starter.id))
    .map(starter => ({ ...starter, kind: "starter" }));
  const allWorkouts = [
    ...savedWorkouts.map(workout => ({ ...workout, kind: "saved" })),
    ...starterCards,
  ];

  const matchingWorkouts = allWorkouts.filter(workout => workout.name.toLowerCase().includes(search.trim().toLowerCase()));

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
    } else {
      const next = [...new Set([...hiddenStarterIds, workout.id])];
      localStorage.setItem(HIDDEN_STARTERS_KEY, JSON.stringify(next));
      setHiddenStarterIds(next);
    }
  }

  function deleteWorkout(workout) {
    const description = workout.kind === "starter"
      ? `Hide "${workout.name}" from your workout list? You can restore the starter workouts later.`
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
          <h1>My workouts</h1>
          <p>Your saved routines and quick starters. Your training plan and history now have their own pages.</p>
        </div>
      </section>

      <p><Link to="/workouts">← Back to Train</Link></p>
      <section className="v4-workout-list">
        <div className="v4-section-heading tf-workouts-heading">
          <div>
            <p className="eyebrow">My library</p>
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

        <label className="tf-library-search-label">Find a workout<input aria-label="Search saved workouts" type="search" placeholder="Search your workouts..." value={search} onChange={(event)=>{setSearch(event.target.value);setVisibleCount(8);}} /></label>

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

        {matchingWorkouts.length === 0 && (
          <p>No workouts here yet. Build or import one below.</p>
        )}

        {matchingWorkouts.slice(0,visibleCount).map((workout) => {
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

        {visibleCount < matchingWorkouts.length && <button type="button" className="tf-workout-restore" onClick={()=>setVisibleCount(n=>n+8)}>Show more workouts ({matchingWorkouts.length-visibleCount} remaining)</button>}

        {hiddenStarterIds.length > 0 && (
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
        <Link className="v4-quick-card" to="/plan">
          <Sparkles size={24} /><strong>My plan</strong><span>View, build or delete training days</span>
        </Link>
      </section>

      <p><Link to="/workouts/history">View full workout history</Link></p>
    </motion.div>
  );
}

import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import ExercisePicker from "../components/ExercisePicker";
import { SavedWorkoutRepository } from "../services/repositories/trackfitDataLayer";
import "./TrackFitScreens.css";

function newSet(reps) {
  return {
    id: crypto.randomUUID(),
    weight: "",
    reps,
    type: "S",
    done: false,
    rpe: "",
    rir: "",
    failure: false,
    note: "",
  };
}

function fromLibrary(exercise) {
  const count = Math.min(30, Math.max(1, Number(exercise.defaultSets) || 3));
  const reps = String(exercise.defaultReps || "8-12");
  return {
    id: `${exercise.id}-${crypto.randomUUID()}`,
    libraryId: exercise.id,
    name: exercise.name,
    image: exercise.image || "",
    primaryMuscles: exercise.primaryMuscles || [],
    equipment: exercise.equipment || [],
    movementPattern: exercise.movementPattern || "unknown",
    defaultRestSeconds: exercise.defaultRestSeconds || 90,
    instructions: exercise.instructions || [],
    target: `${count} sets - ${reps} reps`,
    exerciseNote: "",
    sets: Array.from({ length: count }, () => newSet(reps)),
  };
}

function updatePrescribedSets(exercise, count) {
  const reps = String(exercise.sets?.[0]?.reps || "8-12");
  const sets = [...(exercise.sets || [])];
  while (sets.length < count) sets.push(newSet(reps));
  return { ...exercise, sets: sets.slice(0, count), target: `${count} sets - ${reps} reps` };
}

function updatePrescribedReps(exercise, reps) {
  return {
    ...exercise,
    sets: (exercise.sets || []).map((set) => ({ ...set, reps })),
    target: `${exercise.sets?.length || 0} sets - ${reps} reps`,
  };
}

export default function CreateWorkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const [original] = useState(() => editId ? SavedWorkoutRepository.getById(editId) : null);
  const [name, setName] = useState(() => original?.name || "");
  const [exercises, setExercises] = useState(() => original?.exercises || []);
  const [pickerOpen, setPickerOpen] = useState(false);
  const canSave = Boolean(name.trim() && exercises.length);

  function addExercise(exercise) {
    setExercises((current) => [...current, fromLibrary(exercise)]);
  }

  function removeExercise(id) {
    setExercises((current) => current.filter((exercise) => exercise.id !== id));
  }

  function moveExercise(index, direction) {
    setExercises((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  function editExercise(id, field, value) {
    setExercises((current) => current.map((exercise) => {
      if (exercise.id !== id) return exercise;
      if (field === "sets") {
        const count = Number(value);
        return Number.isInteger(count) && count >= 1 && count <= 30
          ? updatePrescribedSets(exercise, count)
          : exercise;
      }
      return updatePrescribedReps(exercise, value);
    }));
  }

  function saveWorkout(startNow = false) {
    if (!canSave) return;
    const id = original?.id || `saved-${crypto.randomUUID()}`;
    SavedWorkoutRepository.save({
      ...original,
      id,
      name: name.trim(),
      detail: `${exercises.length} exercises`,
      exercises,
    });
    if (startNow) {
      SavedWorkoutRepository.createSession(id);
      navigate(`/workouts/${id}`);
    } else {
      navigate("/workouts?refresh=created");
    }
  }

  return (
    <main className="screen workouts-v4">
      <section className="v4-workout-hero">
        <Link to="/workouts" aria-label="Back to workouts"><ArrowLeft size={22} /></Link>
        <div>
          <p className="eyebrow">Train</p>
          <h1>{original ? "Edit workout" : "Build a workout"}</h1>
          <p>Name it, pick your exercises, save it. That's it.</p>
        </div>
      </section>

      <section className="v4-workout-list">
        <div className="v4-section-heading">
          <div><p className="eyebrow">Step 1</p><h2>Workout name</h2></div>
        </div>
        <input
          aria-label="Workout name"
          autoFocus
          maxLength={80}
          placeholder="e.g. Heavy Shoulders & Arms"
          value={name}
          onChange={(event) => setName(event.target.value)}
          style={{ width: "100%", padding: 16, borderRadius: 12 }}
        />
      </section>

      <section className="v4-workout-list">
        <div className="v4-section-heading">
          <div><p className="eyebrow">Step 2</p><h2>Exercises ({exercises.length})</h2></div>
        </div>

        {exercises.map((exercise, index) => (
          <article className="v4-workout-card" key={exercise.id}>
            <div style={{ display: "grid", gap: 10, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
                <strong style={{ minWidth: 0 }}>{index + 1}. {exercise.name}</strong>
                <div style={{ display: "inline-flex", gap: 2 }}>
                  <button type="button" aria-label={`Move ${exercise.name} up`} disabled={index === 0} onClick={() => moveExercise(index, -1)}><ArrowUp size={18} /></button>
                  <button type="button" aria-label={`Move ${exercise.name} down`} disabled={index === exercises.length - 1} onClick={() => moveExercise(index, 1)}><ArrowDown size={18} /></button>
                  <button type="button" aria-label={`Remove ${exercise.name}`} onClick={() => removeExercise(exercise.id)}><Trash2 size={18} /></button>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 10 }}>
                <label>
                  <small>Sets</small>
                  <input
                    type="number"
                    inputMode="numeric"
                    aria-label={`Sets for ${exercise.name}`}
                    min={1}
                    max={30}
                    value={exercise.sets?.length || 1}
                    onChange={(event) => editExercise(exercise.id, "sets", event.target.value)}
                    style={{ width: "100%", padding: 10, borderRadius: 10 }}
                  />
                </label>
                <label>
                  <small>Reps</small>
                  <input
                    aria-label={`Reps for ${exercise.name}`}
                    value={exercise.sets?.[0]?.reps || ""}
                    onChange={(event) => editExercise(exercise.id, "reps", event.target.value)}
                    placeholder="8-12"
                    style={{ width: "100%", padding: 10, borderRadius: 10 }}
                  />
                </label>
              </div>
            </div>
          </article>
        ))}

        <button type="button" onClick={() => setPickerOpen(true)} style={{ width: "100%", minHeight: 52, display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}>
          <Plus size={20} /> Add exercise from library
        </button>
        {exercises.length === 0 && <p>Tap Add exercise, search your muscle group or equipment, and choose a movement.</p>}
      </section>

      <section className="v4-workout-list">
        <div className="v4-section-heading">
          <div><p className="eyebrow">Step 3</p><h2>Save it</h2></div>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          <button type="button" onClick={() => saveWorkout(false)} disabled={!canSave}><Save size={19} /> Save workout</button>
          <button type="button" onClick={() => saveWorkout(true)} disabled={!canSave}>Save &amp; start now</button>
        </div>
      </section>

      <ExercisePicker isOpen={pickerOpen} onClose={() => setPickerOpen(false)} onSelectExercise={addExercise} />
    </main>
  );
}

import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Upload } from "lucide-react";
import { WorkoutRepository } from "../services/repositories/trackfitDataLayer";
import "./TrackFitScreens.css";

function parseWorkoutText(value) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const match = line.match(
        /^(.+?)\s*[-–:]?\s*(\d+)\s*[x×]\s*(\d+(?:\s*[-–]\s*\d+)?)$/i,
      );

      if (!match) {
        return {
          id: `import-${index}-${crypto.randomUUID()}`,
          name: line,
          sets: "3",
          reps: "10",
        };
      }

      return {
        id: `import-${index}-${crypto.randomUUID()}`,
        name: match[1].trim(),
        sets: match[2],
        reps: match[3].replace(/\s/g, ""),
      };
    });
}

function createWorkoutExercise(exercise) {
  const setCount = Math.max(1, Number.parseInt(exercise.sets, 10) || 1);
  const reps = String(exercise.reps || "10");

  return {
    id: `imported-${crypto.randomUUID()}`,
    name: exercise.name.trim() || "Exercise",
    target: `${setCount} sets - ${reps} reps`,
    primaryMuscles: [],
    equipment: [],
    movementPattern: "training",
    defaultRestSeconds: 90,
    exerciseNote: "",
    sets: Array.from({ length: setCount }, () => ({
      id: crypto.randomUUID(),
      weight: "",
      reps,
      type: "S",
      done: false,
      rpe: "",
      rir: "",
      failure: false,
      note: "",
    })),
  };
}

export default function WorkoutImport() {
  const navigate = useNavigate();
  const [workoutName, setWorkoutName] = useState("Imported Workout");
  const [sourceText, setSourceText] = useState("");
  const [draft, setDraft] = useState([]);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");

  const canParse = sourceText.trim().length > 0;
  const exerciseCount = useMemo(() => draft.length, [draft]);
  const canSave =
    draft.length > 0 &&
    draft.every(
      (exercise) =>
        exercise.name.trim() &&
        Number.parseInt(exercise.sets, 10) > 0 &&
        String(exercise.reps).trim(),
    );

  function handleParse() {
    const parsed = parseWorkoutText(sourceText);
    setDraft(parsed);
    setMessage(`${parsed.length} exercises ready to review.`);
  }

  function updateExercise(id, field, value) {
    setDraft((current) =>
      current.map((exercise) =>
        exercise.id === id ? { ...exercise, [field]: value } : exercise,
      ),
    );
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    setFileName(file?.name || "");
    setMessage(
      file
        ? "PDF selected. Automatic PDF reading is the next step; paste its workout text below for today."
        : "",
    );
  }

  function saveWorkout() {
    if (!canSave) return;

    const workoutId = `imported-${Date.now()}`;
    const workout = draft.map(createWorkoutExercise);
    WorkoutRepository.saveById(workoutId, workout);

    sessionStorage.setItem(
      `trackfit_workout_title_${workoutId}`,
      workoutName.trim() || "Imported Workout",
    );

    navigate(`/workouts/${workoutId}`);
  }

  return (
    <div className="screen workouts-v4">
      <section className="v4-workout-hero">
        <Link to="/workouts" aria-label="Back to Train">
          <ArrowLeft size={22} />
        </Link>
        <div>
          <p className="eyebrow">Train</p>
          <h1>Import workout</h1>
          <p>Paste your program, review it, then open it straight in Gym Mode.</p>
        </div>
      </section>

      <section className="v4-workout-list">
        <div className="v4-section-heading">
          <div>
            <p className="eyebrow">Workout name</p>
            <h2>Name this session</h2>
          </div>
        </div>

        <input
          aria-label="Workout name"
          value={workoutName}
          onChange={(event) => setWorkoutName(event.target.value)}
          style={{ width: "100%", padding: 16, borderRadius: 16 }}
        />
      </section>

      <section className="v4-workout-list">
        <div className="v4-section-heading">
          <div>
            <p className="eyebrow">Paste text</p>
            <h2>Workout details</h2>
          </div>
        </div>

        <textarea
          aria-label="Workout text"
          rows={10}
          value={sourceText}
          onChange={(event) => setSourceText(event.target.value)}
          placeholder={
            "Bench Press - 4 x 8\nIncline Dumbbell Press - 3 x 10\nTricep Pushdown - 3 x 12"
          }
          style={{ width: "100%", resize: "vertical", padding: 16, borderRadius: 16 }}
        />

        <button type="button" onClick={handleParse} disabled={!canParse}>
          <FileText size={20} />
          Turn text into workout
        </button>
      </section>

      <section className="v4-workout-list">
        <div className="v4-section-heading">
          <div>
            <p className="eyebrow">Upload</p>
            <h2>PDF workout</h2>
          </div>
        </div>

        <label className="v4-quick-card" style={{ cursor: "pointer" }}>
          <Upload size={24} />
          <strong>{fileName || "Choose PDF"}</strong>
          <span>Select the file now. Automatic extraction is being wired next.</span>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            hidden
          />
        </label>
      </section>

      {message && <p aria-live="polite">{message}</p>}

      {exerciseCount > 0 && (
        <section className="v4-workout-list">
          <div className="v4-section-heading">
            <div>
              <p className="eyebrow">Review</p>
              <h2>{exerciseCount} exercises found</h2>
            </div>
          </div>

          {draft.map((exercise) => (
            <div className="v4-workout-card" key={exercise.id}>
              <div
                className="v4-workout-card__body"
                style={{ display: "grid", gap: 12 }}
              >
                <input
                  aria-label="Exercise name"
                  value={exercise.name}
                  onChange={(event) =>
                    updateExercise(exercise.id, "name", event.target.value)
                  }
                />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <input
                    aria-label="Sets"
                    inputMode="numeric"
                    value={exercise.sets}
                    placeholder="Sets"
                    onChange={(event) =>
                      updateExercise(exercise.id, "sets", event.target.value)
                    }
                  />
                  <input
                    aria-label="Reps"
                    value={exercise.reps}
                    placeholder="Reps"
                    onChange={(event) =>
                      updateExercise(exercise.id, "reps", event.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          ))}

          <button type="button" disabled={!canSave} onClick={saveWorkout}>
            Save and start workout
          </button>
        </section>
      )}
    </div>
  );
}

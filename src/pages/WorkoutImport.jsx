import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Upload } from "lucide-react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  SavedWorkoutRepository,
  WorkoutRepository,
} from "../services/repositories/trackfitDataLayer";
import "./TrackFitScreens.css";

GlobalWorkerOptions.workerSrc = pdfWorker;

function parseWorkoutText(value) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const match = line.match(
        /^(.+?)\s*[-–:]?\s*(\d+)\s*[x×]\s*(\d+(?:\s*[-–]\s*\d+)?)$/i,
      );
      return match
        ? {
            id: `import-${index}`,
            name: match[1].trim(),
            sets: match[2],
            reps: match[3].replace(/\s/g, ""),
          }
        : { id: `import-${index}`, name: line, sets: "3", reps: "10" };
    });
}

async function extractPdfText(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocument({ data: bytes }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(" "));
  }

  return pages.join("\n");
}

function createWorkoutExercises(draft) {
  return draft
    .filter((exercise) => exercise.name.trim())
    .map((exercise) => {
      const setCount = Math.max(1, Number.parseInt(exercise.sets, 10) || 1);
      const reps = exercise.reps.trim() || "10";

      return {
        id: `imported-${crypto.randomUUID()}`,
        name: exercise.name.trim(),
        target: `${setCount} sets - ${reps} reps`,
        primaryMuscles: [],
        equipment: [],
        movementPattern: "unknown",
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
    });
}

export default function WorkoutImport() {
  const navigate = useNavigate();
  const [workoutName, setWorkoutName] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [draft, setDraft] = useState([]);
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState("");
  const exerciseCount = useMemo(() => draft.length, [draft]);
  const canSave = workoutName.trim() && exerciseCount > 0;

  function handleParse() {
    setDraft(parseWorkoutText(sourceText));
    setStatus("");
  }

  function updateExercise(id, field, value) {
    setDraft((current) =>
      current.map((exercise) =>
        exercise.id === id ? { ...exercise, [field]: value } : exercise,
      ),
    );
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    if (!workoutName.trim()) {
      setWorkoutName(file.name.replace(/\.pdf$/i, ""));
    }
    setStatus("Reading PDF...");

    try {
      const text = await extractPdfText(file);
      setSourceText(text);
      setDraft(parseWorkoutText(text));
      setStatus("PDF read. Check the exercises before saving.");
    } catch {
      setStatus("Could not read that PDF. Try copying and pasting its text instead.");
    }
  }

  function saveWorkout(startAfterSaving) {
    const workoutId = `saved-${Date.now()}`;
    const exercises = createWorkoutExercises(draft);
    const name = workoutName.trim();

    WorkoutRepository.saveById(workoutId, exercises);
    SavedWorkoutRepository.save({
      id: workoutId,
      name,
      detail: `${exercises.length} exercises`,
    });

    navigate(startAfterSaving ? `/workouts/${workoutId}` : "/workouts?refresh=saved");
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
          <p>Paste text or upload a PDF, name it, then save it to Train.</p>
        </div>
      </section>

      <section className="v4-workout-list">
        <div className="v4-section-heading">
          <div>
            <p className="eyebrow">Name</p>
            <h2>Workout name</h2>
          </div>
        </div>
        <input
          aria-label="Workout name"
          value={workoutName}
          onChange={(event) => setWorkoutName(event.target.value)}
          placeholder="Monday Push Workout"
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
          placeholder={"Bench Press - 4 x 8\nIncline Dumbbell Press - 3 x 10"}
          style={{ width: "100%", resize: "vertical", padding: 16, borderRadius: 16 }}
        />
        <button type="button" onClick={handleParse} disabled={!sourceText.trim()}>
          <FileText size={20} /> Turn text into workout
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
          <span>TrackFit reads the PDF on your device.</span>
          <input type="file" accept="application/pdf" onChange={handleFileChange} hidden />
        </label>
        {status && <p>{status}</p>}
      </section>

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
              <div className="v4-workout-card__body" style={{ display: "grid", gap: 12 }}>
                <input
                  aria-label="Exercise name"
                  value={exercise.name}
                  onChange={(event) =>
                    updateExercise(exercise.id, "name", event.target.value)
                  }
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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

          <div style={{ display: "grid", gap: 10 }}>
            <button type="button" disabled={!canSave} onClick={() => saveWorkout(false)}>
              Save workout
            </button>
            <button type="button" disabled={!canSave} onClick={() => saveWorkout(true)}>
              Save and start workout
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
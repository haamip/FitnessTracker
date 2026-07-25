import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, CheckCircle2, FileText, Upload } from "lucide-react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { SavedWorkoutRepository } from "../services/repositories/trackfitDataLayer";
import { parseWorkoutText } from "../services/workoutTextParser";
import "./TrackFitScreens.css";

GlobalWorkerOptions.workerSrc = pdfWorker;

async function extractPdfText(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocument({ data: bytes }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    let pageText = "";

    content.items.forEach((item) => {
      pageText += item.str;
      pageText += item.hasEOL ? "\n" : " ";
    });

    pages.push(pageText.trim());
  }

  return pages.join("\n");
}

function createWorkoutExercises(draft) {
  return draft
    .filter((exercise) => exercise.name.trim() && exercise.sets && exercise.reps)
    .map((exercise) => {
      const setCount = Number.parseInt(exercise.sets, 10);
      const reps = exercise.reps.trim();

      return {
        id: `imported-${crypto.randomUUID()}`,
        name: exercise.name.trim(),
        target: `${setCount} sets - ${reps} reps`,
        primaryMuscles: [],
        equipment: [],
        movementPattern: "unknown",
        defaultRestSeconds: 90,
        exerciseNote: exercise.note?.trim() || "",
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
  const [ignoredLines, setIgnoredLines] = useState([]);
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState("");
  const exerciseCount = useMemo(() => draft.length, [draft]);
  const reviewCount = useMemo(
    () => draft.filter((exercise) => !exercise.sets || !exercise.reps).length,
    [draft],
  );
  const canSave = workoutName.trim() && exerciseCount > 0 && reviewCount === 0;

  function runParser(text) {
    const result = parseWorkoutText(text);
    setDraft(result.exercises);
    setIgnoredLines(result.ignoredLines);
    return result;
  }

  function handleParse() {
    const result = runParser(sourceText);
    setStatus(
      result.exercises.length
        ? `${result.exercises.length} exercises found. Review anything marked below.`
        : "No exercises found. Check the text and try again.",
    );
  }

  function updateExercise(id, field, value) {
    setDraft((current) =>
      current.map((exercise) =>
        exercise.id === id
          ? {
              ...exercise,
              [field]: value,
              needsReview:
                field === "sets" || field === "reps"
                  ? !(field === "sets" ? value : exercise.sets) ||
                    !(field === "reps" ? value : exercise.reps)
                  : exercise.needsReview,
            }
          : exercise,
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
      const result = runParser(text);
      setStatus(
        result.exercises.length
          ? `PDF read: ${result.exercises.length} exercises found, ${result.reviewCount} need review.`
          : "PDF text was read, but no exercises were recognised. Edit the text and parse again.",
      );
    } catch {
      setStatus("Could not read that PDF. Try copying and pasting its text instead.");
    }
  }

  function saveWorkout(startAfterSaving) {
    if (!canSave) return;

    const workoutId = `saved-${Date.now()}`;
    const exercises = createWorkoutExercises(draft);
    const name = workoutName.trim();

    SavedWorkoutRepository.save({
      id: workoutId,
      name,
      detail: `${exercises.length} exercises`,
      exercises,
    });

    if (startAfterSaving) {
      SavedWorkoutRepository.createSession(workoutId);
    }

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
          <p>Paste text or upload a PDF. TrackFit will pull out the exercises for you.</p>
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
          placeholder={
            "Bench Press - 4 x 8\nIncline Dumbbell Press: 3 sets of 10\nCable Fly | 3 | 12-15"
          }
          style={{ width: "100%", resize: "vertical", padding: 16, borderRadius: 16 }}
        />
        <button type="button" onClick={handleParse} disabled={!sourceText.trim()}>
          <FileText size={20} /> Smart parse workout
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

          {reviewCount > 0 ? (
            <div className="v4-quick-card">
              <AlertTriangle size={22} />
              <strong>{reviewCount} need your input</strong>
              <span>TrackFit leaves uncertain sets or reps blank instead of making them up.</span>
            </div>
          ) : (
            <div className="v4-quick-card">
              <CheckCircle2 size={22} />
              <strong>Ready to save</strong>
              <span>All exercises have sets and reps.</span>
            </div>
          )}

          {draft.map((exercise) => (
            <div className="v4-workout-card" key={exercise.id}>
              <div className="v4-workout-card__body" style={{ display: "grid", gap: 12 }}>
                <input
                  aria-label="Exercise name"
                  value={exercise.name}
                  onChange={(event) => updateExercise(exercise.id, "name", event.target.value)}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <input
                    aria-label="Sets"
                    inputMode="numeric"
                    value={exercise.sets}
                    placeholder="Sets required"
                    onChange={(event) => updateExercise(exercise.id, "sets", event.target.value)}
                  />
                  <input
                    aria-label="Reps"
                    value={exercise.reps}
                    placeholder="Reps required"
                    onChange={(event) => updateExercise(exercise.id, "reps", event.target.value)}
                  />
                </div>
                <input
                  aria-label="Exercise note"
                  value={exercise.note || ""}
                  placeholder="Note, tempo, rest or weight (optional)"
                  onChange={(event) => updateExercise(exercise.id, "note", event.target.value)}
                />
                {exercise.needsReview && (
                  <small>Check this one — the source did not clearly include both sets and reps.</small>
                )}
              </div>
            </div>
          ))}

          {ignoredLines.length > 0 && (
            <details>
              <summary>{ignoredLines.length} headings or unrecognised lines ignored</summary>
              <p>{ignoredLines.join(" · ")}</p>
            </details>
          )}

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

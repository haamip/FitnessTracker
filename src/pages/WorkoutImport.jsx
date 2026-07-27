import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, CheckCircle2, FileText, Sparkles, Trash2, Upload } from "lucide-react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { SavedWorkoutRepository } from "../services/repositories/trackfitDataLayer";
import { parseWorkoutText } from "../services/workoutTextParser";
import { parseWorkoutWithAI } from "../services/aiWorkoutImporter";
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
        equipment: exercise.equipment && exercise.equipment !== "unknown" ? [exercise.equipment] : [],
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
  const [aiLoading, setAiLoading] = useState(false);
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
        : "No exercises found. Try the AI reader for messier text.",
    );
  }

  async function handleAIParse() {
    if (!sourceText.trim() || aiLoading) return;
    setAiLoading(true);
    setStatus("AI is reading the workout...");

    try {
      const localResult = parseWorkoutText(sourceText);
      const result = await parseWorkoutWithAI({ text: sourceText, localResult });
      setDraft(result.exercises);
      setIgnoredLines(result.ignoredLines);
      if (!workoutName.trim() && result.workoutName) setWorkoutName(result.workoutName);
      const needsReview = result.exercises.filter((exercise) => exercise.needsReview).length;
      setStatus(
        `${result.exercises.length} exercises found with AI${needsReview ? `, ${needsReview} need review` : ""}.`,
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The AI reader could not parse this workout.");
    } finally {
      setAiLoading(false);
    }
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

  function removeExercise(id) {
    setDraft((current) => current.filter((exercise) => exercise.id !== id));
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    if (!workoutName.trim()) setWorkoutName(file.name.replace(/\.pdf$/i, ""));
    setStatus("Reading PDF...");

    try {
      const text = await extractPdfText(file);
      setSourceText(text);
      const result = runParser(text);
      setStatus(
        result.exercises.length
          ? `PDF read: ${result.exercises.length} exercises found, ${result.reviewCount} need review.`
          : "PDF text was read, but no exercises were recognised. Try the AI reader.",
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

    if (startAfterSaving) SavedWorkoutRepository.createSession(workoutId);
    navigate(startAfterSaving ? `/workouts/${workoutId}` : "/workouts?refresh=saved");
  }

  return (
    <div className="screen workouts-v4">
      <section className="v4-workout-hero">
        <Link to="/workouts" aria-label="Back to Train"><ArrowLeft size={22} /></Link>
        <div>
          <p className="eyebrow">Train</p>
          <h1>Import workout</h1>
          <p>Paste text or upload a PDF. TrackFit will pull out the exercises for you.</p>
        </div>
      </section>

      <section className="v4-workout-list">
        <div className="v4-section-heading"><div><p className="eyebrow">Name</p><h2>Workout name</h2></div></div>
        <input
          aria-label="Workout name"
          value={workoutName}
          onChange={(event) => setWorkoutName(event.target.value)}
          placeholder="Monday Push Workout"
          style={{ width: "100%", padding: 16, borderRadius: 16 }}
        />
      </section>

      <section className="v4-workout-list">
        <div className="v4-section-heading"><div><p className="eyebrow">Paste text</p><h2>Workout details</h2></div></div>
        <textarea
          aria-label="Workout text"
          rows={10}
          value={sourceText}
          onChange={(event) => setSourceText(event.target.value)}
          placeholder={"Bench Press\n4 sets x 6-8 reps\n\nIncline Dumbbell Press,3,10-12"}
          style={{ width: "100%", resize: "vertical", padding: 16, borderRadius: 16 }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button type="button" onClick={handleParse} disabled={!sourceText.trim() || aiLoading}>
            <FileText size={20} /> Quick parse
          </button>
          <button type="button" onClick={handleAIParse} disabled={!sourceText.trim() || aiLoading}>
            <Sparkles size={20} /> {aiLoading ? "Reading..." : "AI reader"}
          </button>
        </div>
      </section>

      <section className="v4-workout-list">
        <div className="v4-section-heading"><div><p className="eyebrow">Upload</p><h2>PDF workout</h2></div></div>
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
          <div className="v4-section-heading"><div><p className="eyebrow">Review</p><h2>{exerciseCount} exercises found</h2></div></div>

          {reviewCount > 0 ? (
            <div className="v4-quick-card">
              <AlertTriangle size={22} /><strong>{reviewCount} need your input</strong>
              <span>TrackFit leaves uncertain sets or reps blank instead of making them up.</span>
            </div>
          ) : (
            <div className="v4-quick-card">
              <CheckCircle2 size={22} /><strong>Ready to save</strong><span>All exercises have sets and reps.</span>
            </div>
          )}

          {draft.map((exercise) => (
            <div className="v4-workout-card" key={exercise.id}>
              <div className="v4-workout-card__body" style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
                  <label>
                    <small>Exercise</small>
                    <input
                      aria-label="Exercise name"
                      value={exercise.name}
                      onChange={(event) => updateExercise(exercise.id, "name", event.target.value)}
                      style={{ width: "100%" }}
                    />
                  </label>
                  <button type="button" aria-label={`Remove ${exercise.name}`} onClick={() => removeExercise(exercise.id)}>
                    <Trash2 size={18} />
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <label>
                    <small>Sets</small>
                    <input
                      aria-label="Sets"
                      inputMode="numeric"
                      value={exercise.sets}
                      placeholder="e.g. 4"
                      onChange={(event) => updateExercise(exercise.id, "sets", event.target.value)}
                      style={{ width: "100%" }}
                    />
                  </label>
                  <label>
                    <small>Reps</small>
                    <input
                      aria-label="Reps"
                      value={exercise.reps}
                      placeholder="e.g. 6-8"
                      onChange={(event) => updateExercise(exercise.id, "reps", event.target.value)}
                      style={{ width: "100%" }}
                    />
                  </label>
                </div>
                <label>
                  <small>Notes</small>
                  <input
                    aria-label="Exercise note"
                    value={exercise.note || ""}
                    placeholder="Tempo, rest or weight (optional)"
                    onChange={(event) => updateExercise(exercise.id, "note", event.target.value)}
                    style={{ width: "100%" }}
                  />
                </label>
                {exercise.needsReview && <small>Check this one — both sets and reps are required.</small>}
              </div>
            </div>
          ))}

          {ignoredLines.length > 0 && (
            <details><summary>{ignoredLines.length} headings or unrecognised lines ignored</summary><p>{ignoredLines.join(" · ")}</p></details>
          )}

          <div style={{ display: "grid", gap: 10 }}>
            <button type="button" disabled={!canSave} onClick={() => saveWorkout(false)}>Save workout</button>
            <button type="button" disabled={!canSave} onClick={() => saveWorkout(true)}>Save and start workout</button>
          </div>
        </section>
      )}
    </div>
  );
}

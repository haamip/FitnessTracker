import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, CheckCircle2, FileText, Sparkles, Trash2, Upload } from "lucide-react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { SavedWorkoutRepository } from "../services/repositories/trackfitDataLayer";
import { TrainingCloudRepository } from "../services/repositories/trainingCloudRepository";
import { supabase } from "../services/supabase";
import { parseWorkoutText } from "../services/workoutTextParser";
import { parseWorkoutWithAI } from "../services/aiWorkoutImporter";
import { isUsableWorkoutExercise } from "../services/workoutImportValidation";
import "./TrackFitScreens.css";
import "./WorkoutImport.css";

GlobalWorkerOptions.workerSrc = pdfWorker;

async function extractPdfText(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocument({ data: bytes, isEvalSupported: false }).promise;
  if (pdf.numPages > 50) throw new Error("Limit PDFs to 50 pages.");
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

  const extracted = pages.join("\n").trim();
  if (!extracted) throw new Error("This appears to be a scanned/image-only PDF. Use a text-based PDF or paste your workout.");
  return extracted;
}

function createWorkoutExercises(draft) {
  return draft
    .filter(isUsableWorkoutExercise)
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
  const [saveError, setSaveError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const exerciseCount = useMemo(() => draft.length, [draft]);
  const reviewCount = useMemo(
    () => draft.filter((exercise) => !isUsableWorkoutExercise(exercise)).length,
    [draft],
  );
  const validCount = exerciseCount - reviewCount;
  const canSave = validCount > 0;

  function runParser(text) {
    const result = parseWorkoutText(text);
    setSaveError("");
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
      setSaveError("");
      setDraft(result.exercises);
      setIgnoredLines(result.ignoredLines);
      if (!workoutName.trim() && result.workoutName) setWorkoutName(result.workoutName);
      const needsReview = result.exercises.filter((exercise) => exercise.needsReview).length;
      setStatus(
        `${result.exercises.length} exercises found using live AI${needsReview ? `, ${needsReview} need review` : ""}. Check exercise names, sets and reps before saving.`,
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The AI reader could not parse this workout.");
    } finally {
      setAiLoading(false);
    }
  }

  function updateExercise(id, field, value) {
    setSaveError("");
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
    setSaveError("");
    setDraft((current) => current.filter((exercise) => exercise.id !== id));
  }

  function addExercise() {
    setSaveError("");
    setDraft((current) => [
      ...current,
      {
        id: `manual-${crypto.randomUUID()}`,
        name: "",
        sets: "",
        reps: "",
        note: "",
        equipment: "unknown",
        needsReview: true,
      },
    ]);
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setStatus("PDF is too large. Choose a file under 10 MB.");
      return;
    }
    if (!/\.pdf$/i.test(file.name)) {
      setStatus("Choose a PDF file.");
      return;
    }
    setFileName(file.name);
    if (!workoutName.trim()) setWorkoutName(file.name.replace(/\.pdf$/i, ""));
    setStatus("Reading PDF...");

    try {
      const text = await extractPdfText(file);
      setSourceText(text);
      const result = runParser(text);
      setStatus(
        result.exercises.length
          ? `PDF read: ${result.exercises.length} exercises found, ${result.reviewCount} need review. ${text.length > 16000 ? "Shorten the text below to use the AI reader." : "Tap AI reader for an improved interpretation."}`
          : "PDF text was read, but no exercises were recognised. Try the AI reader.",
      );
    } catch (error) {
      setDraft([]);
      setIgnoredLines([]);
      setStatus(error instanceof Error ? error.message : "Could not read that PDF. Try copying its text instead.");
    }
  }

  async function saveWorkout(startAfterSaving) {
    if (!canSave || saving) {
      if (!canSave) setSaveError("Add at least one exercise with a name, sets and reps before saving.");
      return;
    }

    if (reviewCount > 0 && !window.confirm(
      `${reviewCount} incomplete exercise${reviewCount === 1 ? "" : "s"} will not be saved. Save the ${validCount} ready exercise${validCount === 1 ? "" : "s"}?`,
    )) return;

    const workoutId = `saved-${crypto.randomUUID()}`;
    const exercises = createWorkoutExercises(draft);
    const name = workoutName.trim() || "Imported workout";
    setSaving(true);
    setSaveError("");

    try {
      if (!supabase) throw new Error("TrackFit account connection is unavailable.");
      const { data: before, error: authError } = await supabase.auth.getUser();
      if (authError || !before.user || before.user.is_anonymous)
        throw new Error("Sign into TrackFit before saving your imported workout.");

      const template = { id: workoutId, name, detail: `${exercises.length} exercises`, exercises };
      // Do not navigate or claim success until this is actually in the user's
      // Supabase workout_templates table. A failed save leaves the editable
      // draft intact so the user can retry without losing work.
      const remote = await TrainingCloudRepository.saveTemplate(template);
      if (!remote?.cloudId) throw new Error("Cloud backup was not confirmed. Try again.");
      const { data: after } = await supabase.auth.getUser();
      if (after.user?.id !== before.user.id)
        throw new Error("Your account changed during saving. Sign back in and retry.");
      SavedWorkoutRepository.save(template, { sync: false });
      if (!SavedWorkoutRepository.getById(workoutId))
        throw new Error("The workout was backed up but couldn't be shown on this device. Refresh your workouts.");
      if (startAfterSaving) SavedWorkoutRepository.createSession(workoutId);
      navigate(startAfterSaving ? `/workouts/${workoutId}` : "/workouts?refresh=saved");
    } catch (error) {
      setSaveError(error instanceof Error ? `Workout not saved: ${error.message}` : "Could not save workout. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="screen workouts-v4 tf-workout-import">
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
          placeholder="Imported workout (or enter your own name)"
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
        <div className="tf-import-action-grid">
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
          <span>TrackFit reads text-based PDFs on your device. Only extracted text is sent to AI when you tap AI reader.</span>
          <input type="file" accept="application/pdf" onChange={handleFileChange} hidden />
        </label>
        {status && <p>{status}</p>}
      </section>

      {exerciseCount > 0 && (
        <section className="v4-workout-list">
          <div className="v4-section-heading"><div><p className="eyebrow">Review &amp; edit</p><h2>{exerciseCount} exercises found</h2><p>Edit names, sets, reps or notes before saving.</p></div></div>

          {reviewCount > 0 ? (
            <div className="v4-quick-card">
              <AlertTriangle size={22} /><strong>{reviewCount} need your input</strong>
              <span>Fill in the missing details or remove these entries. You can still save complete exercises.</span>
            </div>
          ) : (
            <div className="v4-quick-card">
              <CheckCircle2 size={22} /><strong>Ready to save</strong><span>All exercises have sets and reps.</span>
            </div>
          )}

          {draft.map((exercise, index) => (
            <div className="v4-workout-card" key={exercise.id}>
              <div className="v4-workout-card__body tf-import-exercise-body">
                <div className="tf-import-exercise-header">
                  <span className="tf-import-exercise-index">Exercise {index + 1}</span>
                </div>
                <div className="tf-import-name-row">
                  <label>
                    <small>Exercise</small>
                    <input
                      aria-label="Exercise name"
                      value={exercise.name}
                      onChange={(event) => updateExercise(exercise.id, "name", event.target.value)}
                      style={{ width: "100%" }}
                    />
                  </label>
                  <button className="tf-import-remove" type="button" aria-label={`Remove ${exercise.name || `exercise ${index + 1}`}`} onClick={() => removeExercise(exercise.id)}>
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="tf-import-sets-row">
                  <label>
                    <small>Sets</small>
                    <input
                      aria-label="Sets"
                      inputMode="numeric"
                      value={exercise.sets}
                      placeholder="1–30"
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
                {!isUsableWorkoutExercise(exercise) && <small>Check this one — enter an exercise name, 1–30 sets and the rep target.</small>}
              </div>
            </div>
          ))}

          {ignoredLines.length > 0 && (
            <details><summary>{ignoredLines.length} headings or unrecognised lines ignored</summary><p>{ignoredLines.join(" · ")}</p></details>
          )}

          <button type="button" className="tf-import-add" onClick={addExercise}>+ Add exercise</button>
          {reviewCount > 0 && (
            <p className="tf-import-hint">{validCount} ready to save · {reviewCount} incomplete. Fill out or remove incomplete rows to save everything.</p>
          )}
          {!canSave && <p className="tf-import-hint">Add a valid exercise to enable saving. The workout name is optional.</p>}
          {saveError && <p role="alert" className="tf-import-save-error">{saveError}</p>}
          <div className="tf-import-save-actions">
            <button type="button" disabled={!canSave || saving || aiLoading} onClick={() => saveWorkout(false)}>
              {saving ? "Saving to cloud..." : reviewCount ? `Save ${validCount} ready exercise${validCount === 1 ? "" : "s"}` : "Save workout"}
            </button>
            <button type="button" disabled={!canSave || saving || aiLoading} onClick={() => saveWorkout(true)}>{saving ? "Saving to cloud..." : "Save and start workout"}</button>
          </div>
        </section>
      )}
    </div>
  );
}

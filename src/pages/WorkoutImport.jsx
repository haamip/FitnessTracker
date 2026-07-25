import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText, Upload } from "lucide-react";
import "./TrackFitScreens.css";

function parseWorkoutText(value) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const match = line.match(/^(.+?)\s*[-–:]?\s*(\d+)\s*[x×]\s*(\d+(?:\s*[-–]\s*\d+)?)$/i);

      if (!match) {
        return {
          id: `import-${index}`,
          name: line,
          sets: "",
          reps: "",
        };
      }

      return {
        id: `import-${index}`,
        name: match[1].trim(),
        sets: match[2],
        reps: match[3].replace(/\s/g, ""),
      };
    });
}

export default function WorkoutImport() {
  const [sourceText, setSourceText] = useState("");
  const [draft, setDraft] = useState([]);
  const [fileName, setFileName] = useState("");

  const canParse = sourceText.trim().length > 0;
  const exerciseCount = useMemo(() => draft.length, [draft]);

  function handleParse() {
    setDraft(parseWorkoutText(sourceText));
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
          <p>Paste a workout now, or select a PDF ready for the extraction step.</p>
        </div>
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
          placeholder={"Bench Press - 4 x 8\nIncline Dumbbell Press - 3 x 10\nTricep Pushdown - 3 x 12"}
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
          <span>PDF extraction will feed into the same editable review screen.</span>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            hidden
          />
        </label>
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

          <button type="button" disabled>
            Save imported workout
          </button>
        </section>
      )}
    </div>
  );
}

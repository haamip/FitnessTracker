import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const SAMPLE_TEXT = `Day 1 - Push
Bench Press - 4 sets x 8 reps
Incline DB Press - 3 sets x 10 reps
Shoulder Press - 3 sets x 10 reps
Tricep Pushdown - 3 sets x 12 reps

Day 2 - Pull
Lat Pulldown - 4 sets x 10 reps
Seated Row - 3 sets x 10 reps
Face Pulls - 3 sets x 15 reps
Bicep Curls - 3 sets x 12 reps`;

function parseWorkout(text) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const days = [];
  let currentDay = null;

  lines.forEach((line) => {
    const isDay = /^day\s*\d+/i.test(line) || /^workout/i.test(line);

    if (isDay) {
      currentDay = {
        title: line,
        exercises: [],
      };
      days.push(currentDay);
      return;
    }

    if (!currentDay) {
      currentDay = {
        title: "Workout",
        exercises: [],
      };
      days.push(currentDay);
    }

    const parts = line.split(" - ");
    const name = parts[0]?.trim() || line;
    const detail = parts[1]?.trim() || "";

    const setsMatch = detail.match(/(\d+)\s*sets?/i);
    const repsMatch = detail.match(/x\s*([\d-]+)\s*reps?/i) || detail.match(/([\d-]+)\s*reps?/i);

    currentDay.exercises.push({
      name,
      sets: setsMatch ? setsMatch[1] : "",
      reps: repsMatch ? repsMatch[1] : "",
      notes: detail,
    });
  });

  return {
    id: Date.now().toString(),
    name: days[0]?.title || "New Workout",
    createdAt: new Date().toISOString(),
    days,
  };
}

function Workouts() {
  const [workouts, setWorkouts] = useState([]);
  const [rawText, setRawText] = useState("");

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("trackfit_workouts") || "[]");
    setWorkouts(saved);
  }, []);

  function saveWorkouts(next) {
    setWorkouts(next);
    localStorage.setItem("trackfit_workouts", JSON.stringify(next));
  }

  function handleImport() {
    if (!rawText.trim()) return;

    const parsed = parseWorkout(rawText);
    saveWorkouts([parsed, ...workouts]);
    setRawText("");
  }

  function loadSample() {
    setRawText(SAMPLE_TEXT);
  }

  function deleteWorkout(id) {
    saveWorkouts(workouts.filter((workout) => workout.id !== id));
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Workouts</h1>
          <p>Upload or paste a workout plan and TrackFit will lay it out.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <h2>Import Workout</h2>
          <p className="muted">
            Paste your plan below. Keep it simple for now: Day name, then exercises.
          </p>

          <textarea
            className="textarea"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Day 1 - Push&#10;Bench Press - 4 sets x 8 reps&#10;Incline DB Press - 3 sets x 10 reps"
          />

          <div className="button-row">
            <button className="primary-btn" onClick={handleImport}>
              Save Workout
            </button>
            <button className="secondary-btn" onClick={loadSample}>
              Load Example
            </button>
          </div>
        </section>

        <section className="panel">
          <h2>Saved Workouts</h2>

          {workouts.length === 0 ? (
            <p className="muted">No workouts saved yet.</p>
          ) : (
            <div className="workout-list">
              {workouts.map((workout) => (
                <div className="workout-card" key={workout.id}>
                  <div>
                    <h3>{workout.name}</h3>
                    <p className="muted">
                      {workout.days.length} day{workout.days.length === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div className="button-row">
                    <Link className="small-link" to={`/workouts/${workout.id}`}>
                      Open
                    </Link>
                    <button className="danger-btn" onClick={() => deleteWorkout(workout.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export default Workouts;

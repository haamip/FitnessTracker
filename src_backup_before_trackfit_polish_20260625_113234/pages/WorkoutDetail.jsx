/*
|--------------------------------------------------------------------------
| WorkoutDetail.jsx
|--------------------------------------------------------------------------
| Individual workout page.
|
| Future Features:
| - Exercise logging
| - Sets tracking
| - Reps tracking
| - Weight tracking
| - Workout completion
|
| Purpose:
| Record completed gym sessions.
|--------------------------------------------------------------------------
*/
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

function WorkoutDetail() {
  const { id } = useParams();
  const workouts = JSON.parse(localStorage.getItem("trackfit_workouts") || "[]");

  const [workout] = useState(() =>
    workouts.find((item) => item.id === id) || null
  );

  const [session, setSession] = useState(() =>
    JSON.parse(localStorage.getItem(`trackfit_session_${id}`) || "{}")
  );

  function updateExercise(dayIndex, exerciseIndex, field, value) {
    const key = `${dayIndex}-${exerciseIndex}`;

    const next = {
      ...session,
      [key]: {
        completed: false,
        weight: "",
        repsDone: "",
        notes: "",
        ...(session[key] || {}),
        [field]: value,
      },
    };

    setSession(next);
    localStorage.setItem(`trackfit_session_${id}`, JSON.stringify(next));
  }

  function toggleDone(dayIndex, exerciseIndex) {
    const key = `${dayIndex}-${exerciseIndex}`;
    const current = session[key] || {};

    updateExercise(dayIndex, exerciseIndex, "completed", !current.completed);
  }

  if (!workout) {
    return (
      <section className="panel">
        <h2>Workout not found</h2>
        <Link to="/workouts">Back to workouts</Link>
      </section>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{workout.name}</h1>
          <p>Log your weights, reps and notes as you train.</p>
        </div>

        <Link className="small-link" to="/workouts">
          Back
        </Link>
      </div>

      <div className="workout-days">
        {workout.days.map((day, dayIndex) => (
          <section className="panel" key={dayIndex}>
            <h2>{day.title}</h2>

            <div className="exercise-list">
              {day.exercises.map((exercise, exerciseIndex) => {
                const key = `${dayIndex}-${exerciseIndex}`;
                const current = session[key] || {};

                return (
                  <div className="exercise-card exercise-log-card" key={key}>
                    <label className="exercise-check">
                      <input
                        type="checkbox"
                        checked={!!current.completed}
                        onChange={() => toggleDone(dayIndex, exerciseIndex)}
                      />
                      <div>
                        <h3>{exercise.name}</h3>
                        <p>
                          Target:{" "}
                          {exercise.sets && <strong>{exercise.sets} sets</strong>}
                          {exercise.sets && exercise.reps && " x "}
                          {exercise.reps && <strong>{exercise.reps} reps</strong>}
                        </p>
                        {exercise.notes && <p className="muted">{exercise.notes}</p>}
                      </div>
                    </label>

                    <div className="log-grid">
                      <label>
                        Weight used
                        <input
                          type="number"
                          value={current.weight || ""}
                          onChange={(e) =>
                            updateExercise(dayIndex, exerciseIndex, "weight", e.target.value)
                          }
                          placeholder="kg"
                        />
                      </label>

                      <label>
                        Reps achieved
                        <input
                          type="text"
                          value={current.repsDone || ""}
                          onChange={(e) =>
                            updateExercise(dayIndex, exerciseIndex, "repsDone", e.target.value)
                          }
                          placeholder="8,8,7,6"
                        />
                      </label>

                      <label className="log-notes">
                        Notes
                        <input
                          type="text"
                          value={current.notes || ""}
                          onChange={(e) =>
                            updateExercise(dayIndex, exerciseIndex, "notes", e.target.value)
                          }
                          placeholder="Felt strong, sore shoulder, etc"
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

export default WorkoutDetail;





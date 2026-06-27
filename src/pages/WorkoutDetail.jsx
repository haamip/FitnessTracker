import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  Circle,
  MoreHorizontal,
  NotepadText,
  Play,
  Plus,
  Timer,
} from "lucide-react";
import ExercisePicker from "../components/ExercisePicker";
import "./TrackFitScreens.css";

function createSet(weight = "", reps = "10", type = "S") {
  return {
    id: crypto.randomUUID(),
    weight,
    reps,
    type,
    done: false,
  };
}

function createDefaultExercises() {
  return [
    {
      id: "rdl",
      name: "Dumbbell Romanian Deadlift",
      target: "2 sets • 10 reps",
      image: "TF",
      sets: [createSet("35", "10"), createSet("35", "10")],
    },
    {
      id: "calf",
      name: "Dumbbell Standing Calf Raise",
      target: "2 sets • 12 reps",
      image: "TF",
      sets: [createSet("20", "12"), createSet("20", "12")],
    },
    {
      id: "press",
      name: "Dumbbell Shoulder Press",
      target: "2 sets • 10 reps",
      image: "TF",
      sets: [createSet("25", "10"), createSet("25", "10")],
    },
    {
      id: "row",
      name: "Dumbbell Row",
      target: "2 sets • 10 reps",
      image: "TF",
      sets: [createSet("35", "10"), createSet("35", "10")],
    },
    {
      id: "squat",
      name: "Barbell Back Squat",
      target: "2 sets • 10 reps",
      image: "TF",
      sets: [createSet("80", "10"), createSet("80", "10")],
    },
  ];
}

function formatClock(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function readJson(key, fallback) {
  const saved = localStorage.getItem(key);

  if (!saved) {
    return fallback;
  }

  try {
    return JSON.parse(saved);
  } catch {
    return fallback;
  }
}

function findAiDay(id) {
  const plan = readJson("trackfit_ai_workout_plan", []);
  return plan.find((day) => day.id === id);
}

function convertAiDayToWorkout(day) {
  return day.exercises.map((exercise) => ({
    id: `${exercise.id}-${crypto.randomUUID()}`,
    libraryId: exercise.id,
    name: exercise.name,
    target: `${exercise.sets} sets • ${exercise.reps} reps`,
    image: "TF",
    primaryMuscles: exercise.primaryMuscles || [],
    equipment: exercise.equipment || [],
    movementPattern: exercise.movementPattern || "unknown",
    sets: Array.from({ length: exercise.sets }, () => createSet("", exercise.reps, "S")),
  }));
}

export default function WorkoutDetail() {
  const { id = "workout-1" } = useParams();
  const navigate = useNavigate();
  const storageKey = `trackfit_workout_${id}`;
  const aiDay = findAiDay(id);

  const [seconds, setSeconds] = useState(0);
  const [restSeconds, setRestSeconds] = useState(60);
  const [restRunning, setRestRunning] = useState(false);
  const [notes, setNotes] = useState("");
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const [exercises, setExercises] = useState(() => {
    const savedWorkout = readJson(storageKey, null);

    if (savedWorkout) {
      return savedWorkout;
    }

    if (aiDay) {
      return convertAiDayToWorkout(aiDay);
    }

    return createDefaultExercises();
  });

  const [openExerciseId, setOpenExerciseId] = useState(() => exercises[0]?.id || "");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSeconds((currentSeconds) => currentSeconds + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!restRunning) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setRestSeconds((currentSeconds) => {
        if (currentSeconds <= 1) {
          setRestRunning(false);
          return 60;
        }

        return currentSeconds - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [restRunning]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(exercises));
  }, [exercises, storageKey]);

  const totals = useMemo(() => {
    const totalSets = exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
    const doneSets = exercises.reduce(
      (sum, exercise) => sum + exercise.sets.filter((set) => set.done).length,
      0,
    );

    const volume = exercises.reduce(
      (sum, exercise) =>
        sum +
        exercise.sets.reduce((setSum, set) => {
          if (!set.done) {
            return setSum;
          }

          const weight = Number.parseFloat(set.weight) || 0;
          const reps = Number.parseFloat(set.reps) || 0;
          return setSum + weight * reps;
        }, 0),
      0,
    );

    return {
      totalSets,
      doneSets,
      volume,
      percent: totalSets === 0 ? 0 : Math.round((doneSets / totalSets) * 100),
    };
  }, [exercises]);

  function updateSet(exerciseId, setId, field, value) {
    setExercises((currentExercises) =>
      currentExercises.map((exercise) => {
        if (exercise.id !== exerciseId) {
          return exercise;
        }

        return {
          ...exercise,
          sets: exercise.sets.map((set) =>
            set.id === setId ? { ...set, [field]: value } : set,
          ),
        };
      }),
    );
  }

  function addSet(exerciseId) {
    setExercises((currentExercises) =>
      currentExercises.map((exercise) => {
        if (exercise.id !== exerciseId) {
          return exercise;
        }

        const previousSet = exercise.sets.at(-1) || {
          weight: "",
          reps: "10",
          type: "S",
        };

        return {
          ...exercise,
          sets: [...exercise.sets, createSet(previousSet.weight, previousSet.reps, previousSet.type)],
        };
      }),
    );
  }

  /*
    This is where the Exercise Engine plugs into the Workout Logger.

    The picker sends one clean exercise object from exerciseLibrary.js.
    We convert it into a loggable workout exercise with sets, reps, weight,
    and completion status.

    The AI Builder saves workouts in this same shape, so manual workouts and
    AI workouts stay compatible from day one.
  */
  function addExerciseFromLibrary(libraryExercise) {
    const setCount = libraryExercise.defaultSets || 3;
    const reps = String(libraryExercise.defaultReps || "8-12");

    const newExercise = {
      id: `${libraryExercise.id}-${crypto.randomUUID()}`,
      libraryId: libraryExercise.id,
      name: libraryExercise.name,
      target: `${setCount} sets • ${reps} reps`,
      image: "TF",
      primaryMuscles: libraryExercise.primaryMuscles || [],
      equipment: libraryExercise.equipment || [],
      movementPattern: libraryExercise.movementPattern || "unknown",
      sets: Array.from({ length: setCount }, () => createSet("", reps, "S")),
    };

    setExercises((currentExercises) => [...currentExercises, newExercise]);
    setOpenExerciseId(newExercise.id);
  }

  function finishWorkout() {
    const history = readJson("trackfit_workout_history", []);
    const finishedWorkout = {
      id: crypto.randomUUID(),
      workoutId: id,
      title: aiDay?.name || "Workout 1",
      completedAt: new Date().toISOString(),
      durationSeconds: seconds,
      completedSets: totals.doneSets,
      totalSets: totals.totalSets,
      volume: totals.volume,
      notes,
      exercises,
    };

    localStorage.setItem("trackfit_workout_history", JSON.stringify([finishedWorkout, ...history]));
    navigate("/workouts");
  }

  const workoutTitle = aiDay?.name || "Workout 1";
  const canFinish = totals.doneSets > 0;

  return (
    <motion.div
      className="screen tf-gym-mode"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <header className="tf-workout-topbar">
        <Link aria-label="Back to workouts" to="/workouts">
          <ArrowLeft size={24} />
        </Link>

        <h1>{workoutTitle}</h1>
        <time>{formatClock(seconds)}</time>
      </header>

      <section className="tf-progress-block">
        <div className="tf-progress-track">
          <span style={{ width: `${totals.percent}%` }} />
        </div>

        <div className="tf-progress-meta">
          <span>{totals.percent}% COMPLETE</span>
          <span>{totals.doneSets}/{totals.totalSets} SETS • {Math.round(totals.volume)} KG</span>
        </div>
      </section>

      <section className="tf-exercise-stack">
        {exercises.map((exercise, exerciseIndex) => {
          const isOpen = exercise.id === openExerciseId;

          return (
            <article className={isOpen ? "tf-exercise-card open" : "tf-exercise-card"} key={exercise.id}>
              <button
                className="tf-exercise-summary"
                onClick={() => setOpenExerciseId(exercise.id)}
                type="button"
              >
                <span className="tf-exercise-number">{exerciseIndex + 1}</span>
                <span className="tf-exercise-art" aria-hidden="true">{exercise.image}</span>

                <span className="tf-exercise-title">
                  <strong>{exercise.name}</strong>
                  <small>{exercise.target}</small>
                </span>

                {isOpen ? <MoreHorizontal size={24} /> : <ChevronRight size={24} />}
              </button>

              {isOpen && (
                <div className="tf-open-panel">
                  <div className="tf-target-box">
                    <div>
                      <strong>TARGET</strong>
                      <span>{exercise.target}</span>
                    </div>

                    <div>
                      <strong>NOTES</strong>
                      <NotepadText size={22} />
                    </div>
                  </div>

                  <div className="tf-sets-head">
                    <span>Set</span>
                    <span>Weight (kg)</span>
                    <span>Reps</span>
                    <span>Set Type</span>
                    <span>Done</span>
                  </div>

                  <div className="tf-set-list">
                    {exercise.sets.map((set, setIndex) => (
                      <div className={set.done ? "tf-set-row done" : "tf-set-row"} key={set.id}>
                        <span>{setIndex + 1}</span>

                        <label aria-label={`Set ${setIndex + 1} rest timer`}>
                          <Timer size={20} />
                        </label>

                        <input
                          inputMode="decimal"
                          onChange={(event) =>
                            updateSet(exercise.id, set.id, "weight", event.target.value)
                          }
                          value={set.weight}
                        />

                        <input
                          inputMode="numeric"
                          onChange={(event) =>
                            updateSet(exercise.id, set.id, "reps", event.target.value)
                          }
                          value={set.reps}
                        />

                        <select
                          onChange={(event) =>
                            updateSet(exercise.id, set.id, "type", event.target.value)
                          }
                          value={set.type}
                        >
                          <option value="S">S</option>
                          <option value="W">W</option>
                          <option value="D">D</option>
                          <option value="F">F</option>
                        </select>

                        <button
                          aria-label={`Mark set ${setIndex + 1} done`}
                          className="tf-done-btn"
                          onClick={() => updateSet(exercise.id, set.id, "done", !set.done)}
                          type="button"
                        >
                          <Circle size={22} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button className="tf-add-set-btn" onClick={() => addSet(exercise.id)} type="button">
                    <Plus size={19} />
                    Add Set
                  </button>

                  <div className="tf-rest-card">
                    <div>
                      <strong>REST TIMER</strong>
                      <span>{formatClock(restSeconds)}</span>
                      <button onClick={() => setRestRunning(true)} type="button">
                        {restRunning ? "Rest timer running" : "Start Rest Timer"}
                      </button>
                    </div>

                    <button
                      aria-label="Start rest timer"
                      className="tf-play-btn"
                      onClick={() => setRestRunning((current) => !current)}
                      type="button"
                    >
                      <Play size={24} fill="currentColor" />
                    </button>
                  </div>

                  <textarea
                    className="tf-notes-input"
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Session notes, pain, PRs, form cues..."
                    value={notes}
                  />
                </div>
              )}
            </article>
          );
        })}

        <button className="tf-add-exercise-card" onClick={() => setIsPickerOpen(true)} type="button">
          <Plus size={20} />
          Add Exercise
        </button>
      </section>

      <ExercisePicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelectExercise={addExerciseFromLibrary}
      />

      <footer className="tf-workout-actions">
        <Link to="/workouts">Cancel Workout</Link>
        <button className={canFinish ? "ready" : ""} disabled={!canFinish} onClick={finishWorkout} type="button">
          Save Workout
        </button>
      </footer>
    </motion.div>
  );
}

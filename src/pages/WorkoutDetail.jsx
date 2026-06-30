import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronRight,
  Copy,
  Info,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import ExercisePicker from "../components/ExercisePicker";
import ExerciseImage from "../components/ui/ExerciseImage";
import RestTimer from "../components/ui/RestTimer";
import SetLogger from "../components/ui/SetLogger";
import WorkoutSummary from "../components/ui/WorkoutSummary";
import { exerciseLibrary } from "../data/exerciseLibrary";
import { detectWorkoutPRs } from "../services/prEngine";
import { getExerciseRecommendation } from "../services/progressionEngine";
import {
  buildCompletedWorkout,
  calculateWorkoutTotals,
  findPreviousExercise,
  formatClock,
  generateWarmUpSets,
  readWorkoutHistory,
  WORKOUT_HISTORY_KEY,
} from "../services/workoutEngine";
import { readJson, writeJson } from "../services/storage";
import "./TrackFitScreens.css";

const DEFAULT_REST_SECONDS = 90;

const FALLBACK_EXERCISE_IMAGE = "/exercise-images/trackfit-fallback.svg";

function findLibraryExerciseById(id) {
  return exerciseLibrary.find((exercise) => exercise.id === id);
}

function findLibraryExerciseByName(name) {
  const normalisedName = String(name || "").trim().toLowerCase();
  return exerciseLibrary.find((exercise) => exercise.name.toLowerCase() === normalisedName);
}

function resolveExerciseImage(exercise) {
  if (exercise?.image && exercise.image !== "TF") {
    return exercise.image;
  }

  const libraryExercise =
    findLibraryExerciseById(exercise?.libraryId || exercise?.id) || findLibraryExerciseByName(exercise?.name);

  return libraryExercise?.image || FALLBACK_EXERCISE_IMAGE;
}

function parseRestSeconds(value) {
  if (typeof value === "number") {
    return value;
  }

  if (!value) {
    return DEFAULT_REST_SECONDS;
  }

  const restText = String(value).toLowerCase();
  const rangeMatch = restText.match(/(\d+)\s*-\s*(\d+)/);

  if (rangeMatch) {
    return Number.parseInt(rangeMatch[2], 10);
  }

  const singleMatch = restText.match(/(\d+)/);

  if (!singleMatch) {
    return DEFAULT_REST_SECONDS;
  }

  const restValue = Number.parseInt(singleMatch[1], 10);
  return restText.includes("min") ? restValue * 60 : restValue;
}

function createSet(weight = "", reps = "10", type = "S") {
  return {
    id: crypto.randomUUID(),
    weight,
    reps,
    type,
    done: false,
    rpe: "",
    rir: "",
    failure: false,
    note: "",
  };
}

function createDefaultExercises() {
  return [
    {
      id: "rdl",
      name: "Dumbbell Romanian Deadlift",
      target: "2 sets • 10 reps",
      image: resolveExerciseImage({ id: "rdl", name: "Dumbbell Romanian Deadlift" }),
      primaryMuscles: ["hamstrings"],
      equipment: ["dumbbell"],
      movementPattern: "hinge",
      defaultRestSeconds: 90,
      sets: [createSet("35", "10"), createSet("35", "10")],
    },
    {
      id: "calf",
      name: "Dumbbell Standing Calf Raise",
      target: "2 sets • 12 reps",
      image: resolveExerciseImage({ id: "calf", name: "Dumbbell Standing Calf Raise" }),
      primaryMuscles: ["calves"],
      equipment: ["dumbbell"],
      movementPattern: "calf_raise",
      defaultRestSeconds: 60,
      sets: [createSet("20", "12"), createSet("20", "12")],
    },
    {
      id: "press",
      name: "Dumbbell Shoulder Press",
      target: "2 sets • 10 reps",
      image: resolveExerciseImage({ id: "press", name: "Dumbbell Shoulder Press" }),
      primaryMuscles: ["shoulders"],
      equipment: ["dumbbell"],
      movementPattern: "vertical_push",
      defaultRestSeconds: 90,
      sets: [createSet("25", "10"), createSet("25", "10")],
    },
    {
      id: "row",
      name: "Dumbbell Row",
      target: "2 sets • 10 reps",
      image: resolveExerciseImage({ id: "row", name: "Dumbbell Row" }),
      primaryMuscles: ["lats"],
      equipment: ["dumbbell"],
      movementPattern: "horizontal_pull",
      defaultRestSeconds: 90,
      sets: [createSet("35", "10"), createSet("35", "10")],
    },
    {
      id: "squat",
      name: "Barbell Back Squat",
      target: "2 sets • 10 reps",
      image: resolveExerciseImage({ id: "squat", name: "Barbell Back Squat" }),
      primaryMuscles: ["quadriceps"],
      equipment: ["barbell"],
      movementPattern: "squat",
      defaultRestSeconds: 120,
      sets: [createSet("80", "10"), createSet("80", "10")],
    },
  ];
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
    image: resolveExerciseImage(exercise),
    primaryMuscles: exercise.primaryMuscles || [],
    equipment: exercise.equipment || [],
    movementPattern: exercise.movementPattern || "unknown",
    defaultRestSeconds: parseRestSeconds(exercise.rest),
    exerciseNote: "",
    sets: Array.from({ length: exercise.sets }, () => createSet("", exercise.reps, "S")),
  }));
}

function duplicateWorkoutExercise(exercise) {
  return {
    ...exercise,
    id: `${exercise.libraryId || exercise.id}-${crypto.randomUUID()}`,
    sets: exercise.sets.map((set) => ({
      ...set,
      id: crypto.randomUUID(),
      done: false,
    })),
  };
}

export default function WorkoutDetail() {
  const { id = "workout-1" } = useParams();
  const navigate = useNavigate();
  const storageKey = `trackfit_workout_${id}`;
  const aiDay = findAiDay(id);

  const [seconds, setSeconds] = useState(0);
  const [restSeconds, setRestSeconds] = useState(DEFAULT_REST_SECONDS);
  const [restRunning, setRestRunning] = useState(false);
  const [activeRestLabel, setActiveRestLabel] = useState("Rest ready");
  const [restCompletedMessage, setRestCompletedMessage] = useState("");
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

  // Workout history feeds previous-set targets, PR checks and progression advice.
  const workoutHistory = useMemo(() => readWorkoutHistory(), []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSeconds((currentSeconds) => currentSeconds + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const notifyRestFinished = useCallback((exerciseName) => {
    const message = `${exerciseName || "Your"} rest is finished. Time for the next set.`;

    if ("vibrate" in navigator) {
      navigator.vibrate([250, 120, 250]);
    }

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("TrackFit rest finished", {
        body: message,
        silent: false,
      });
    }
  }, []);

  function requestNotificationPermission() {
    if (!("Notification" in window) || Notification.permission !== "default") {
      return;
    }

    Notification.requestPermission().catch(() => {
      // If the phone/browser blocks notification permission, TrackFit still uses the in-app timer.
    });
  }

  function getExerciseRestSeconds(exercise) {
    return parseRestSeconds(exercise.defaultRestSeconds || exercise.rest || DEFAULT_REST_SECONDS);
  }

  function startRestTimer(exercise) {
    const restDuration = getExerciseRestSeconds(exercise);

    /*
      Rest timer automation

      The user should not have to press a separate Start Rest button while training.
      When a set is ticked done, TrackFit automatically:
      1. reads the exercise rest time,
      2. starts the countdown,
      3. asks for notification permission if needed,
      4. vibrates/sends a notification when rest finishes.
    */
    setRestSeconds(restDuration);
    setActiveRestLabel(`${exercise.name} rest`);
    setRestCompletedMessage("");
    setRestRunning(true);
    requestNotificationPermission();
  }

  function skipRestTimer() {
    setRestRunning(false);
    setRestSeconds(0);
    setRestCompletedMessage("Rest skipped. Ready when you are.");
  }

  function addRestTime(extraSeconds) {
    setRestSeconds((currentSeconds) => currentSeconds + extraSeconds);
    setRestRunning(true);
  }

  useEffect(() => {
    if (!restRunning) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setRestSeconds((currentSeconds) => {
        if (currentSeconds <= 1) {
          setRestRunning(false);
          setRestCompletedMessage(`${activeRestLabel} finished. Next set.`);
          notifyRestFinished(activeRestLabel.replace(" rest", ""));
          return 0;
        }

        return currentSeconds - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activeRestLabel, notifyRestFinished, restRunning]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(exercises));
  }, [exercises, storageKey]);

  const totals = useMemo(() => calculateWorkoutTotals(exercises), [exercises]);

  function updateSet(exerciseId, setId, field, value) {
    setExercises((currentExercises) =>
      currentExercises.map((exercise) => {
        if (exercise.id !== exerciseId) {
          return exercise;
        }

        if (field === "done" && value) {
          startRestTimer(exercise);
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

  function removeSet(exerciseId, setId) {
    setExercises((currentExercises) =>
      currentExercises.map((exercise) => {
        if (exercise.id !== exerciseId || exercise.sets.length === 1) {
          return exercise;
        }

        return {
          ...exercise,
          sets: exercise.sets.filter((set) => set.id !== setId),
        };
      }),
    );
  }

  function moveExercise(exerciseId, direction) {
    setExercises((currentExercises) => {
      const currentIndex = currentExercises.findIndex((exercise) => exercise.id === exerciseId);
      const nextIndex = currentIndex + direction;

      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= currentExercises.length) {
        return currentExercises;
      }

      const reorderedExercises = [...currentExercises];
      const [movedExercise] = reorderedExercises.splice(currentIndex, 1);
      reorderedExercises.splice(nextIndex, 0, movedExercise);
      return reorderedExercises;
    });
  }

  function removeExercise(exerciseId) {
    setExercises((currentExercises) => {
      const nextExercises = currentExercises.filter((exercise) => exercise.id !== exerciseId);

      if (openExerciseId === exerciseId) {
        setOpenExerciseId(nextExercises[0]?.id || "");
      }

      return nextExercises;
    });
  }

  function duplicateExercise(exercise) {
    const duplicatedExercise = duplicateWorkoutExercise(exercise);

    setExercises((currentExercises) => {
      const currentIndex = currentExercises.findIndex((item) => item.id === exercise.id);
      const nextExercises = [...currentExercises];
      nextExercises.splice(currentIndex + 1, 0, duplicatedExercise);
      return nextExercises;
    });

    setOpenExerciseId(duplicatedExercise.id);
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
      image: libraryExercise.image || FALLBACK_EXERCISE_IMAGE,
      primaryMuscles: libraryExercise.primaryMuscles || [],
      equipment: libraryExercise.equipment || [],
      movementPattern: libraryExercise.movementPattern || "unknown",
      defaultRestSeconds: libraryExercise.defaultRestSeconds || DEFAULT_REST_SECONDS,
      instructions: libraryExercise.instructions || [],
      exerciseNote: "",
      sets: Array.from({ length: setCount }, () => createSet("", reps, "S")),
    };

    setExercises((currentExercises) => [...currentExercises, newExercise]);
    setOpenExerciseId(newExercise.id);
  }

  function updateExerciseField(exerciseId, field, value) {
    setExercises((currentExercises) =>
      currentExercises.map((exercise) =>
        exercise.id === exerciseId ? { ...exercise, [field]: value } : exercise,
      ),
    );
  }

  function addWarmUpSets(exercise) {
    const warmUpSets = generateWarmUpSets(exercise, createSet);

    if (warmUpSets.length === 0) {
      setRestCompletedMessage("Add a working weight first, then TrackFit can generate warm-ups.");
      return;
    }

    setExercises((currentExercises) =>
      currentExercises.map((item) =>
        item.id === exercise.id ? { ...item, sets: [...warmUpSets, ...item.sets] } : item,
      ),
    );
  }

  function finishWorkout() {
    const history = readWorkoutHistory();
    const prs = detectWorkoutPRs(history, exercises);
    const finishedWorkout = buildCompletedWorkout({
      id,
      title: aiDay?.name || "Workout 1",
      seconds,
      notes,
      exercises,
      totals,
      prs,
    });

    writeJson(WORKOUT_HISTORY_KEY, [finishedWorkout, ...history]);
    localStorage.removeItem(storageKey);
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

        {/* Live workout intelligence: simple stats that update as sets are checked off. */}
        <WorkoutSummary seconds={seconds} totals={totals} />
      </section>

      {exercises.length === 0 && (
        <section className="tf-empty-workout">
          <strong>Empty workout</strong>
          <span>Add your first exercise from the library.</span>
          <button onClick={() => setIsPickerOpen(true)} type="button">
            <Plus size={18} /> Add Exercise
          </button>
        </section>
      )}

      <section className="tf-exercise-stack">
        {exercises.map((exercise, exerciseIndex) => {
          const isOpen = exercise.id === openExerciseId;
          const recommendation = getExerciseRecommendation(exercise, workoutHistory);
          const previousExercise = recommendation.previousExercise || findPreviousExercise(workoutHistory, exercise);

          return (
            <article className={isOpen ? "tf-exercise-card open" : "tf-exercise-card"} key={exercise.id}>
              <button
                className="tf-exercise-summary"
                onClick={() => setOpenExerciseId(exercise.id)}
                type="button"
              >
                <span className="tf-exercise-number">{exerciseIndex + 1}</span>
                <ExerciseImage exercise={exercise} />

                <span className="tf-exercise-title">
                  <strong>{exercise.name}</strong>
                  <small>
                    {exercise.target}
                    {exercise.movementPattern ? ` • ${exercise.movementPattern.replaceAll("_", " ")}` : ""}
                  </small>
                </span>

                {isOpen ? <MoreHorizontal size={24} /> : <ChevronRight size={24} />}
              </button>

              {isOpen && (
                <div className="tf-open-panel">
                  <div className="tf-exercise-tools">
                    <button onClick={() => moveExercise(exercise.id, -1)} type="button">
                      <ArrowUp size={16} /> Up
                    </button>
                    <button onClick={() => moveExercise(exercise.id, 1)} type="button">
                      <ArrowDown size={16} /> Down
                    </button>
                    <button onClick={() => addWarmUpSets(exercise)} type="button">
                      <Plus size={16} /> Warm-up
                    </button>
                    <button onClick={() => duplicateExercise(exercise)} type="button">
                      <Copy size={16} /> Duplicate
                    </button>
                    <button className="danger" onClick={() => removeExercise(exercise.id)} type="button">
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>

                  <div className="tf-target-box">
                    <div>
                      <strong>TARGET</strong>
                      <span>{exercise.target}</span>
                    </div>

                    <div>
                      <strong>DETAILS</strong>
                      <Link
                        className="tf-detail-link"
                        state={{ returnTo: `/workouts/${id}` }}
                        to={`/exercises/${exercise.libraryId || exercise.id}`}
                      >
                        <Info size={18} /> Open
                      </Link>
                    </div>
                  </div>

                  {/* Previous session + progression reason for this exercise. */}
                  <div className="tf-coach-cue">
                    <strong>Coach target</strong>
                    <span>{recommendation.reason}</span>
                  </div>

                  <SetLogger
                    exercise={exercise}
                    previousExercise={previousExercise}
                    recommendation={recommendation}
                    onAddSet={addSet}
                    onRemoveSet={removeSet}
                    onUpdateSet={updateSet}
                  />

                  {exercise.instructions?.length > 0 && (
                    <details className="tf-instructions-box">
                      <summary>How to perform</summary>
                      <ol>
                        {exercise.instructions.slice(0, 4).map((instruction) => (
                          <li key={instruction}>{instruction}</li>
                        ))}
                      </ol>
                    </details>
                  )}

                  <RestTimer
                    activeRestLabel={activeRestLabel}
                    restCompletedMessage={restCompletedMessage}
                    restRunning={restRunning}
                    restSeconds={restSeconds}
                    onAddTime={addRestTime}
                    onSkip={skipRestTimer}
                    onToggle={() => setRestRunning((current) => !current)}
                  />

                  <textarea
                    className="tf-notes-input"
                    onChange={(event) => updateExerciseField(exercise.id, "exerciseNote", event.target.value)}
                    placeholder="Exercise notes, pain, form cues, setup reminders..."
                    value={exercise.exerciseNote || ""}
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

      <section className="tf-session-note-card">
        <strong>Session notes</strong>
        <textarea
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Overall workout notes, energy, aches, wins..."
          value={notes}
        />
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

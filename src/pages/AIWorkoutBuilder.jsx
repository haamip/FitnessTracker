import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Brain, Dumbbell, RefreshCcw, Save, Sparkles } from "lucide-react";
import {
  equipmentLabels,
  generateWorkoutPlan,
  goalPrescription,
} from "../services/aiWorkoutEngine";
import { writeJson } from "../services/storage";
import "./TrackFitScreens.css";

function convertDayToWorkout(day) {
  return day.exercises.map((exercise) => ({
    id: `${exercise.id}-${crypto.randomUUID()}`,
    libraryId: exercise.id,
    name: exercise.name,
    target: `${exercise.sets} sets • ${exercise.reps} reps`,
    image: "TF",
    primaryMuscles: exercise.primaryMuscles || [],
    equipment: exercise.equipment || [],
    movementPattern: exercise.movementPattern || "unknown",
    instructions: exercise.instructions || [],
    defaultRestSeconds: Number.parseInt(exercise.rest, 10) || 90,
    sets: Array.from({ length: exercise.sets }, () => ({
      id: crypto.randomUUID(),
      weight: "",
      reps: exercise.reps,
      type: "S",
      done: false,
    })),
  }));
}

export default function AIWorkoutBuilder() {
  const [goal, setGoal] = useState("muscle");
  const [days, setDays] = useState("4");
  const [time, setTime] = useState("60");
  const [level, setLevel] = useState("intermediate");
  const [equipment, setEquipment] = useState("full gym");
  const [injuryFocus, setInjuryFocus] = useState("none");
  const [saved, setSaved] = useState(false);
  const [planVersion, setPlanVersion] = useState(1);

  const prescription = useMemo(() => goalPrescription(goal, level), [goal, level]);

  const plan = useMemo(
    () =>
      generateWorkoutPlan({
        goal,
        days,
        time,
        level,
        equipment,
        injuryFocus,
        planVersion,
      }),
    [days, equipment, goal, injuryFocus, level, planVersion, time],
  );

  function savePlan() {
    /*
      Saving the AI plan creates two records:
      1. trackfit_ai_workout_plan: shown on the Workouts page.
      2. trackfit_workout_ai-X: the actual editable workout logger data.

      This keeps generated plans editable instead of locking them inside the AI
      Builder screen. It also means AI and manual workouts share the same logger.
    */
    writeJson("trackfit_ai_workout_plan", plan);

    plan.forEach((day) => {
      writeJson(`trackfit_workout_${day.id}`, convertDayToWorkout(day));
    });

    setSaved(true);
  }

  function regeneratePlan() {
    setPlanVersion((currentVersion) => currentVersion + 1);
    setSaved(false);
  }

  return (
    <main className="screen tf-ai-builder ai-builder-v2">
      {/* Page hero: explains that this builder is driven by library logic, not fake presets. */}
      <header className="tf-builder-top ai-builder-hero">
        <Link to="/workouts" aria-label="Back to workouts">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <p>AI Builder v3</p>
          <h1>Build Workout</h1>
          <span>Library-based plans, ready to edit and log.</span>
        </div>
      </header>

      {/* User inputs become constraints for the AI rules engine. */}
      <section className="tf-builder-panel ai-control-panel">
        <label>
          Goal
          <select value={goal} onChange={(event) => setGoal(event.target.value)}>
            <option value="muscle">Build Muscle</option>
            <option value="strength">Strength</option>
            <option value="fatloss">Fat Loss</option>
          </select>
        </label>

        <label>
          Days Per Week
          <select value={days} onChange={(event) => setDays(event.target.value)}>
            <option value="3">3 Days</option>
            <option value="4">4 Days</option>
          </select>
        </label>

        <label>
          Workout Length
          <select value={time} onChange={(event) => setTime(event.target.value)}>
            <option value="45">45 mins</option>
            <option value="60">60 mins</option>
            <option value="75">75 mins</option>
          </select>
        </label>

        <label>
          Experience
          <select value={level} onChange={(event) => setLevel(event.target.value)}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </label>

        <label>
          Equipment
          <select value={equipment} onChange={(event) => setEquipment(event.target.value)}>
            <option value="full gym">Full Gym</option>
            <option value="dumbbells">Dumbbells</option>
            <option value="home">Home / Minimal Kit</option>
          </select>
        </label>

        <label>
          Protect Area
          <select value={injuryFocus} onChange={(event) => setInjuryFocus(event.target.value)}>
            <option value="none">No injury filter</option>
            <option value="shoulder">Shoulder friendly</option>
            <option value="knee">Knee friendly</option>
            <option value="lower_back">Lower-back friendly</option>
          </select>
        </label>
      </section>

      {/* Short explanation so the user knows why the generated plan changed. */}
      <section className="ai-builder-brain-card">
        <Brain size={22} />
        <div>
          <strong>How this plan was built</strong>
          <p>
            TrackFit chooses movement patterns first, then picks matching exercises from the library based on your goal,
            equipment, level and protect-area setting.
          </p>
        </div>
      </section>

      <section className="tf-generated-plan">
        <div className="tf-generated-head">
          <div>
            <p>Generated From Exercise Library</p>
            <h2>{days} Day Program</h2>
          </div>
          <Sparkles size={24} />
        </div>

        <div className="ai-program-summary">
          <span>{equipmentLabels[equipment]}</span>
          <span>{prescription.sets} sets</span>
          <span>{prescription.reps} reps</span>
          <span>{prescription.rest}</span>
        </div>

        {plan.map((day) => (
          <article className="tf-generated-day ai-day-card" key={day.id}>
            <div className="ai-day-head">
              <Dumbbell size={22} />
              <h3>{day.name}</h3>
              <span>{day.time} mins • {day.equipment}</span>
            </div>

            <div className="ai-exercise-list">
              {day.exercises.map((exercise) => (
                <div className="ai-exercise-row" key={`${day.id}-${exercise.id}`}>
                  <strong>{exercise.name}</strong>
                  <span>{exercise.movementPattern?.replaceAll("_", " ") || "movement"}</span>
                  <small>{exercise.sets} sets x {exercise.reps} • {exercise.rest}</small>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <div className="ai-builder-actions">
        <button className="ai-secondary-btn" onClick={regeneratePlan} type="button">
          <RefreshCcw size={18} />
          Regenerate
        </button>

        <button className="tf-save-plan-btn" onClick={savePlan} type="button">
          <Save size={20} />
          {saved ? "Plan Saved - go to Workouts" : "Save Program"}
        </button>
      </div>
    </main>
  );
}

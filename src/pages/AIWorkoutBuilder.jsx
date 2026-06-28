import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Brain, Dumbbell, RefreshCcw, Save, Sparkles } from "lucide-react";
import { exerciseLibrary } from "../data/exerciseLibrary";
import "./TrackFitScreens.css";

const splitTemplates = {
  muscle: [
    { name: "Upper A", slots: ["horizontal_push", "horizontal_pull", "vertical_push", "vertical_pull", "elbow_flexion", "elbow_extension"] },
    { name: "Lower A", slots: ["squat", "hinge", "squat", "calf_raise", "core"] },
    { name: "Upper B", slots: ["horizontal_push", "horizontal_pull", "vertical_push", "vertical_pull", "elbow_flexion", "elbow_extension"] },
    { name: "Lower B", slots: ["hinge", "squat", "calf_raise", "core", "conditioning"] },
  ],
  strength: [
    { name: "Heavy Upper", slots: ["horizontal_push", "horizontal_pull", "vertical_push", "vertical_pull"] },
    { name: "Heavy Lower", slots: ["squat", "hinge", "squat", "core"] },
    { name: "Bench Focus", slots: ["horizontal_push", "horizontal_push", "horizontal_pull", "elbow_extension"] },
    { name: "Deadlift Focus", slots: ["hinge", "squat", "horizontal_pull", "core"] },
  ],
  fatloss: [
    { name: "Full Body Strength", slots: ["squat", "horizontal_push", "horizontal_pull", "hinge", "conditioning"] },
    { name: "Conditioning Circuit", slots: ["conditioning", "squat", "horizontal_push", "core"] },
    { name: "Upper Circuit", slots: ["horizontal_push", "horizontal_pull", "vertical_push", "vertical_pull", "core"] },
    { name: "Lower Circuit", slots: ["squat", "hinge", "calf_raise", "core", "conditioning"] },
  ],
};

const equipmentLabels = {
  "full gym": "Full Gym",
  dumbbells: "Dumbbells",
  home: "Home / Minimal Kit",
};

function goalPrescription(goal, level) {
  if (goal === "strength") {
    return {
      sets: level === "beginner" ? 3 : 4,
      reps: "4-6",
      rest: "120 sec",
      note: "Heavy work. Longer rests. Add load slowly.",
    };
  }

  if (goal === "fatloss") {
    return {
      sets: level === "beginner" ? 2 : 3,
      reps: "10-15",
      rest: "45-60 sec",
      note: "Controlled pace. Keep the heart rate up.",
    };
  }

  return {
    sets: level === "beginner" ? 2 : 3,
    reps: "8-12",
    rest: "60-90 sec",
    note: "Muscle building range. Chase quality reps.",
  };
}

function equipmentMatches(exercise, equipment) {
  if (equipment === "full gym") return true;

  const exerciseEquipment = (exercise.equipment || []).join(" ").toLowerCase();

  if (equipment === "dumbbells") {
    return exerciseEquipment.includes("dumbbell") || exerciseEquipment.includes("body only");
  }

  if (equipment === "home") {
    return exerciseEquipment.includes("body only") || exerciseEquipment.includes("dumbbell");
  }

  return true;
}

function injurySafe(exercise, injuryFocus) {
  if (injuryFocus === "none") return true;

  const name = exercise.name.toLowerCase();
  const pattern = exercise.movementPattern || "";

  if (injuryFocus === "shoulder") {
    return !name.includes("behind the neck") && pattern !== "vertical_push";
  }

  if (injuryFocus === "knee") {
    return pattern !== "squat" || name.includes("bodyweight") || name.includes("box");
  }

  if (injuryFocus === "lower_back") {
    return pattern !== "hinge" || name.includes("dumbbell") || name.includes("glute");
  }

  return true;
}

function scoreExercise(exercise, slot, equipment, usedExerciseIds, injuryFocus) {
  let score = 0;

  if (exercise.movementPattern === slot) score += 60;
  if (equipmentMatches(exercise, equipment)) score += 25;
  if (injurySafe(exercise, injuryFocus)) score += 15;
  if (usedExerciseIds.has(exercise.id)) score -= 100;
  if ((exercise.difficulty || "").toLowerCase() === "beginner") score += 2;

  return score;
}

function pickExercise(slot, equipment, usedExerciseIds, injuryFocus) {
  const rankedExercises = exerciseLibrary
    .map((exercise) => ({
      exercise,
      score: scoreExercise(exercise, slot, equipment, usedExerciseIds, injuryFocus),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.exercise.name.localeCompare(b.exercise.name));

  return rankedExercises[0]?.exercise || exerciseLibrary[0];
}

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

  const plan = useMemo(() => {
    const selectedTemplates = splitTemplates[goal].slice(0, Number(days));
    const usedExerciseIds = new Set();

    /*
      AI Builder v2 brain

      This builder now works from the TrackFit exercise library instead of hardcoded exercises.
      The flow is:
      1. Pick a training split based on the user's goal and days per week.
      2. Convert each workout into movement pattern slots.
      3. Search exerciseLibrary for the best exercise for each slot.
      4. Score choices by movement pattern, equipment, injury filter, and duplicates.
      5. Save the generated days into the same workout logger format the app already uses.

      This keeps one source of truth:
      Exercise Library -> AI Builder -> Workout Logger -> History -> Future Coach.
    */
    return selectedTemplates.map((template, index) => ({
      id: `ai-${index + 1}`,
      name: template.name,
      focus: goal,
      time,
      level,
      equipment,
      injuryFocus,
      planVersion,
      exercises: template.slots.map((slot) => {
        const selectedExercise = pickExercise(slot, equipment, usedExerciseIds, injuryFocus);
        usedExerciseIds.add(selectedExercise.id);

        return {
          id: selectedExercise.id,
          name: selectedExercise.name,
          movementPattern: selectedExercise.movementPattern,
          primaryMuscles: selectedExercise.primaryMuscles || [],
          equipment: selectedExercise.equipment || [],
          instructions: selectedExercise.instructions || [],
          ...prescription,
        };
      }),
    }));
  }, [days, equipment, goal, injuryFocus, level, planVersion, prescription, time]);

  function savePlan() {
    localStorage.setItem("trackfit_ai_workout_plan", JSON.stringify(plan));

    plan.forEach((day) => {
      localStorage.setItem(`trackfit_workout_${day.id}`, JSON.stringify(convertDayToWorkout(day)));
    });

    setSaved(true);
  }

  function regeneratePlan() {
    setPlanVersion((currentVersion) => currentVersion + 1);
    setSaved(false);
  }

  return (
    <main className="screen tf-ai-builder ai-builder-v2">
      <header className="tf-builder-top ai-builder-hero">
        <Link to="/workouts" aria-label="Back to workouts">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <p>AI Builder v2</p>
          <h1>Build Workout</h1>
          <span>Uses the real TrackFit exercise library.</span>
        </div>
      </header>

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

      <section className="ai-builder-brain-card">
        <Brain size={22} />
        <div>
          <strong>How this plan was built</strong>
          <p>
            TrackFit picks movement patterns first, then selects matching exercises from the library based on your goal,
            kit, level and protect-area setting.
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

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Dumbbell, Save, Sparkles } from "lucide-react";
import { exerciseLibrary } from "../data/exerciseLibrary";
import "./TrackFitScreens.css";

const templates = {
  muscle: [
    {
      name: "Upper A",
      slots: ["horizontal_push", "horizontal_pull", "vertical_push", "vertical_pull", "elbow_flexion", "elbow_extension"],
    },
    {
      name: "Lower A",
      slots: ["squat", "hinge", "squat", "calf_raise", "core"],
    },
    {
      name: "Upper B",
      slots: ["horizontal_push", "horizontal_pull", "vertical_push", "vertical_pull", "elbow_flexion", "elbow_extension"],
    },
    {
      name: "Lower B",
      slots: ["hinge", "squat", "calf_raise", "core", "conditioning"],
    },
  ],
  strength: [
    {
      name: "Heavy Upper",
      slots: ["horizontal_push", "horizontal_pull", "vertical_push", "vertical_pull"],
    },
    {
      name: "Heavy Lower",
      slots: ["squat", "hinge", "squat", "core"],
    },
    {
      name: "Bench Focus",
      slots: ["horizontal_push", "horizontal_push", "horizontal_pull", "elbow_extension"],
    },
    {
      name: "Deadlift Focus",
      slots: ["hinge", "squat", "horizontal_pull", "core"],
    },
  ],
  fatloss: [
    {
      name: "Full Body Strength",
      slots: ["squat", "horizontal_push", "horizontal_pull", "hinge", "conditioning"],
    },
    {
      name: "Conditioning",
      slots: ["conditioning", "squat", "horizontal_push", "core"],
    },
    {
      name: "Upper Circuit",
      slots: ["horizontal_push", "horizontal_pull", "vertical_push", "vertical_pull", "core"],
    },
    {
      name: "Lower Circuit",
      slots: ["squat", "hinge", "calf_raise", "core", "conditioning"],
    },
  ],
};

function goalPrescription(goal, level) {
  if (goal === "strength") {
    return {
      sets: level === "beginner" ? 3 : 4,
      reps: "4-6",
      rest: "120 sec",
    };
  }

  if (goal === "fatloss") {
    return {
      sets: level === "beginner" ? 2 : 3,
      reps: "10-15",
      rest: "45-60 sec",
    };
  }

  return {
    sets: level === "beginner" ? 2 : 3,
    reps: "8-12",
    rest: "60-90 sec",
  };
}

function equipmentMatches(exercise, equipment) {
  if (equipment === "full gym") {
    return true;
  }

  const exerciseEquipment = (exercise.equipment || []).join(" ").toLowerCase();

  if (equipment === "dumbbells") {
    return exerciseEquipment.includes("dumbbell") || exerciseEquipment.includes("body only");
  }

  if (equipment === "home") {
    return exerciseEquipment.includes("body only") || exerciseEquipment.includes("dumbbell");
  }

  return true;
}

function pickExercise(slot, equipment, usedExerciseIds) {
  const exactMatches = exerciseLibrary.filter(
    (exercise) =>
      exercise.movementPattern === slot &&
      equipmentMatches(exercise, equipment) &&
      !usedExerciseIds.has(exercise.id),
  );

  const backupMatches = exerciseLibrary.filter(
    (exercise) => equipmentMatches(exercise, equipment) && !usedExerciseIds.has(exercise.id),
  );

  return exactMatches[0] || backupMatches[0] || exerciseLibrary[0];
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
  const [saved, setSaved] = useState(false);

  const plan = useMemo(() => {
    const selectedTemplates = templates[goal].slice(0, Number(days));
    const usedExerciseIds = new Set();
    const prescription = goalPrescription(goal, level);

    /*
      AI Builder brain, v1

      This is not using fake presets anymore.
      It uses workout structure templates made of movement patterns, then fills
      each slot from the real TrackFit exercise library.

      Example:
      - horizontal_push becomes Bench Press, Dumbbell Press, Push Up, etc.
      - hinge becomes Deadlift, Romanian Deadlift, Good Morning, etc.
      - vertical_pull becomes Pull Up, Lat Pulldown, etc.

      Later this same selection step can consider injuries, favourites,
      previous lifts, recovery, and available equipment.
    */
    return selectedTemplates.map((template, index) => ({
      id: `ai-${index + 1}`,
      name: template.name,
      focus: goal,
      time,
      level,
      equipment,
      exercises: template.slots.map((slot) => {
        const selectedExercise = pickExercise(slot, equipment, usedExerciseIds);
        usedExerciseIds.add(selectedExercise.id);

        return {
          id: selectedExercise.id,
          name: selectedExercise.name,
          movementPattern: selectedExercise.movementPattern,
          primaryMuscles: selectedExercise.primaryMuscles || [],
          equipment: selectedExercise.equipment || [],
          ...prescription,
        };
      }),
    }));
  }, [goal, days, time, level, equipment]);

  function savePlan() {
    localStorage.setItem("trackfit_ai_workout_plan", JSON.stringify(plan));

    plan.forEach((day) => {
      localStorage.setItem(`trackfit_workout_${day.id}`, JSON.stringify(convertDayToWorkout(day)));
    });

    setSaved(true);
  }

  return (
    <main className="screen tf-ai-builder">
      <header className="tf-builder-top">
        <Link to="/workouts" aria-label="Back to workouts">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <p>AI Builder</p>
          <h1>Build Workout</h1>
        </div>
      </header>

      <section className="tf-builder-panel">
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
            <option value="home">Home</option>
          </select>
        </label>
      </section>

      <section className="tf-generated-plan">
        <div className="tf-generated-head">
          <div>
            <p>Generated From Exercise Library</p>
            <h2>{days} Day Program</h2>
          </div>
          <Sparkles size={24} />
        </div>

        {plan.map((day) => (
          <article className="tf-generated-day" key={day.id}>
            <div>
              <Dumbbell size={22} />
              <h3>{day.name}</h3>
              <span>{day.time} mins • {day.equipment}</span>
            </div>

            {day.exercises.map((exercise) => (
              <p key={`${day.id}-${exercise.id}`}>
                <strong>{exercise.name}</strong>
                <span>{exercise.sets} sets × {exercise.reps} • {exercise.rest}</span>
              </p>
            ))}
          </article>
        ))}
      </section>

      <button className="tf-save-plan-btn" onClick={savePlan} type="button">
        <Save size={20} />
        {saved ? "Plan Saved — go to Workouts" : "Save Program"}
      </button>
    </main>
  );
}

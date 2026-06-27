import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { exerciseLibrary } from "../data/exerciseLibrary";
import "../pages/TrackFitScreens.css";

const muscleFilters = ["all", "chest", "lats", "quadriceps", "hamstrings", "shoulders", "biceps", "triceps", "abdominals"];
const equipmentFilters = ["all", "barbell", "dumbbell", "machine", "cable", "body only"];

/*
  Exercise Picker v2

  This is the manual entry side of the Exercise Engine.
  It reads the same exerciseLibrary.js file that the AI Builder uses.

  That means:
  - Manual workout logging
  - AI generated workouts
  - future progress tracking
  - future exercise substitutions

  all speak the same language and use the same exercise IDs.
*/
export default function ExercisePicker({ isOpen, onClose, onSelectExercise }) {
  const [query, setQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState("all");
  const [selectedEquipment, setSelectedEquipment] = useState("all");

  const filteredExercises = useMemo(() => {
    const search = query.trim().toLowerCase();

    return exerciseLibrary
      .filter((exercise) => {
        const muscles = [...(exercise.primaryMuscles || []), ...(exercise.secondaryMuscles || [])]
          .join(" ")
          .toLowerCase();
        const equipment = (exercise.equipment || []).join(" ").toLowerCase();
        const tags = (exercise.tags || []).join(" ").toLowerCase();

        const matchesSearch = !search || [exercise.name, muscles, equipment, tags, exercise.movementPattern]
          .join(" ")
          .toLowerCase()
          .includes(search);

        const matchesMuscle = selectedMuscle === "all" || muscles.includes(selectedMuscle);
        const matchesEquipment = selectedEquipment === "all" || equipment.includes(selectedEquipment);

        return matchesSearch && matchesMuscle && matchesEquipment;
      })
      .slice(0, 80);
  }, [query, selectedMuscle, selectedEquipment]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="tf-picker-backdrop">
      <section className="tf-picker-sheet" aria-label="Exercise picker">
        <header className="tf-picker-head">
          <div>
            <p>Add Exercise</p>
            <h2>Exercise Library</h2>
          </div>

          <button aria-label="Close exercise picker" onClick={onClose} type="button">
            <X size={24} />
          </button>
        </header>

        <label className="tf-picker-search">
          <Search size={20} />
          <input
            autoFocus
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search chest, dumbbell, squat..."
            value={query}
          />
        </label>

        <div className="tf-filter-row" aria-label="Muscle filters">
          {muscleFilters.map((muscle) => (
            <button
              className={selectedMuscle === muscle ? "active" : ""}
              key={muscle}
              onClick={() => setSelectedMuscle(muscle)}
              type="button"
            >
              {muscle === "all" ? "All" : muscle}
            </button>
          ))}
        </div>

        <div className="tf-filter-row" aria-label="Equipment filters">
          {equipmentFilters.map((equipment) => (
            <button
              className={selectedEquipment === equipment ? "active" : ""}
              key={equipment}
              onClick={() => setSelectedEquipment(equipment)}
              type="button"
            >
              {equipment === "all" ? "All kit" : equipment}
            </button>
          ))}
        </div>

        <div className="tf-picker-count">{filteredExercises.length} exercises found</div>

        <div className="tf-picker-list">
          {filteredExercises.map((exercise) => (
            <button
              className="tf-picker-item"
              key={exercise.id}
              onClick={() => {
                onSelectExercise(exercise);
                setQuery("");
                onClose();
              }}
              type="button"
            >
              <span className="tf-picker-art">TF</span>

              <span>
                <strong>{exercise.name}</strong>
                <small>
                  {(exercise.primaryMuscles || []).join(", ") || "General"} •{" "}
                  {(exercise.equipment || []).join(", ") || "Bodyweight"}
                </small>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Clock3, Info, Search, Star, X } from "lucide-react";
import { exerciseLibrary } from "../data/exerciseLibrary";
import "../pages/TrackFitScreens.css";

const muscleFilters = [
  "all",
  "chest",
  "lats",
  "quadriceps",
  "hamstrings",
  "shoulders",
  "biceps",
  "triceps",
  "abdominals",
  "calves",
];

const FALLBACK_EXERCISE_IMAGE = "/exercise-images/trackfit-fallback.svg";

const equipmentFilters = [
  "all",
  "barbell",
  "dumbbell",
  "machine",
  "cable",
  "body only",
  "kettlebells",
];

function readStoredList(key) {
  const saved = localStorage.getItem(key);

  if (!saved) {
    return [];
  }

  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

function saveStoredList(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatLabel(value) {
  if (value === "all") {
    return "All";
  }

  if (value === "body only") {
    return "Bodyweight";
  }

  return value;
}

function ExerciseAvatar({ exercise }) {
  const [hasImage, setHasImage] = useState(Boolean(exercise.image));
  const imageSource = exercise.image || FALLBACK_EXERCISE_IMAGE;

  return (
    <span className="tf-picker-art">
      {hasImage ? (
        <img
          alt=""
          loading="lazy"
          src={imageSource}
          onError={() => setHasImage(false)}
        />
      ) : (
        "TF"
      )}
    </span>
  );
}

/*
  Exercise Picker v3

  This is the manual workout entry side of the Exercise Engine.

  It now supports:
  - library search
  - muscle filters
  - equipment filters
  - favourites
  - recent exercises
  - a preview card before adding

  The important architecture rule stays the same:
  this picker and the AI Builder both read from exerciseLibrary.js.
  One source of truth, no duplicate exercise lists.
*/
export default function ExercisePicker({ isOpen, onClose, onSelectExercise }) {
  const [query, setQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState("all");
  const [selectedEquipment, setSelectedEquipment] = useState("all");
  const [viewMode, setViewMode] = useState("all");
  const [previewExercise, setPreviewExercise] = useState(null);
  const [favouriteIds, setFavouriteIds] = useState(() =>
    readStoredList("trackfit_favourite_exercises"),
  );
  const [recentIds, setRecentIds] = useState(() =>
    readStoredList("trackfit_recent_exercises"),
  );

  const favouriteIdSet = useMemo(() => new Set(favouriteIds), [favouriteIds]);
  const recentIdSet = useMemo(() => new Set(recentIds), [recentIds]);

  const filteredExercises = useMemo(() => {
    const search = query.trim().toLowerCase();

    return exerciseLibrary
      .filter((exercise) => {
        const muscles = [
          ...(exercise.primaryMuscles || []),
          ...(exercise.secondaryMuscles || []),
        ]
          .join(" ")
          .toLowerCase();
        const equipment = (exercise.equipment || []).join(" ").toLowerCase();
        const tags = (exercise.tags || []).join(" ").toLowerCase();

        const matchesMode =
          viewMode === "all" ||
          (viewMode === "favourites" && favouriteIdSet.has(exercise.id)) ||
          (viewMode === "recent" && recentIdSet.has(exercise.id));

        const matchesSearch =
          !search ||
          [
            exercise.name,
            muscles,
            equipment,
            tags,
            exercise.movementPattern,
            exercise.category,
          ]
            .join(" ")
            .toLowerCase()
            .includes(search);

        const matchesMuscle =
          selectedMuscle === "all" || muscles.includes(selectedMuscle);
        const matchesEquipment =
          selectedEquipment === "all" || equipment.includes(selectedEquipment);

        return (
          matchesMode && matchesSearch && matchesMuscle && matchesEquipment
        );
      })
      .sort((a, b) => {
        const aRecentIndex = recentIds.indexOf(a.id);
        const bRecentIndex = recentIds.indexOf(b.id);

        if (viewMode === "recent" && aRecentIndex !== bRecentIndex) {
          return aRecentIndex - bRecentIndex;
        }

        return a.name.localeCompare(b.name);
      })
      .slice(0, 80);
  }, [
    favouriteIdSet,
    query,
    recentIdSet,
    recentIds,
    selectedEquipment,
    selectedMuscle,
    viewMode,
  ]);

  function toggleFavourite(exerciseId) {
    setFavouriteIds((currentIds) => {
      const nextIds = currentIds.includes(exerciseId)
        ? currentIds.filter((id) => id !== exerciseId)
        : [exerciseId, ...currentIds];

      saveStoredList("trackfit_favourite_exercises", nextIds);
      return nextIds;
    });
  }

  function selectExercise(exercise) {
    const nextRecentIds = [
      exercise.id,
      ...recentIds.filter((id) => id !== exercise.id),
    ].slice(0, 20);

    setRecentIds(nextRecentIds);
    saveStoredList("trackfit_recent_exercises", nextRecentIds);
    onSelectExercise(exercise);
    setQuery("");
    setPreviewExercise(null);
    onClose();
  }

  if (!isOpen) {
    return null;
  }

  const preview = previewExercise || filteredExercises[0];

  return (
    <div className="tf-picker-backdrop">
      <section className="tf-picker-sheet" aria-label="Exercise picker">
        <header className="tf-picker-head">
          <div>
            <p>Add Exercise</p>
            <h2>Exercise Library</h2>
          </div>

          <button
            aria-label="Close exercise picker"
            onClick={onClose}
            type="button"
          >
            <X size={24} />
          </button>
        </header>

        <label className="tf-picker-search">
          <Search size={20} />
          <input
            autoFocus
            id="exercise-picker-search"
            name="exercisePickerSearch"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search chest, dumbbell, squat..."
            value={query}
          />
        </label>

        <div className="tf-filter-row" aria-label="Library views">
          <button
            className={viewMode === "all" ? "active" : ""}
            onClick={() => setViewMode("all")}
            type="button"
          >
            All
          </button>
          <button
            className={viewMode === "favourites" ? "active" : ""}
            onClick={() => setViewMode("favourites")}
            type="button"
          >
            <Star size={14} /> Favourites
          </button>
          <button
            className={viewMode === "recent" ? "active" : ""}
            onClick={() => setViewMode("recent")}
            type="button"
          >
            <Clock3 size={14} /> Recent
          </button>
        </div>

        <div className="tf-filter-row" aria-label="Muscle filters">
          {muscleFilters.map((muscle) => (
            <button
              className={selectedMuscle === muscle ? "active" : ""}
              key={muscle}
              onClick={() => setSelectedMuscle(muscle)}
              type="button"
            >
              {formatLabel(muscle)}
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
              {equipment === "all" ? "All kit" : formatLabel(equipment)}
            </button>
          ))}
        </div>

        {preview && (
          <article className="tf-picker-preview">
            <ExerciseAvatar exercise={preview} />
            <div>
              <strong>{preview.name}</strong>
              <span>
                {(preview.primaryMuscles || []).join(", ") || "General"} ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢{" "}
                {preview.movementPattern || "movement"}
              </span>
              <small>
                {(preview.equipment || []).join(", ") || "Bodyweight"} ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢{" "}
                {preview.defaultSets || 3} sets ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢{" "}
                {preview.defaultReps || "8-12"}
              </small>
            </div>
            <div className="tf-picker-preview-actions">
              <Link to={`/exercises/${preview.id}`} onClick={onClose}>
                <Info size={17} /> Details
              </Link>
              <button onClick={() => selectExercise(preview)} type="button">
                <Check size={18} /> Add
              </button>
            </div>
          </article>
        )}

        <div className="tf-picker-count">
          {filteredExercises.length} exercises found
        </div>

        <div className="tf-picker-list">
          {filteredExercises.map((exercise) => {
            const isFavourite = favouriteIdSet.has(exercise.id);
            const isSelected = preview?.id === exercise.id;

            return (
              <article
                className={
                  isSelected ? "tf-picker-item selected" : "tf-picker-item"
                }
                key={exercise.id}
                onClick={() => setPreviewExercise(exercise)}
              >
                <ExerciseAvatar exercise={exercise} />

                <span>
                  <strong>{exercise.name}</strong>
                  <small>
                    {(exercise.primaryMuscles || []).join(", ") || "General"}{" "}
                    ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢{" "}
                    {(exercise.equipment || []).join(", ") || "Bodyweight"}
                  </small>
                </span>

                <span className="tf-picker-actions">
                  <button
                    aria-label={
                      isFavourite ? "Remove favourite" : "Favourite exercise"
                    }
                    className={isFavourite ? "active" : ""}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleFavourite(exercise.id);
                    }}
                    type="button"
                  >
                    <Star
                      size={17}
                      fill={isFavourite ? "currentColor" : "none"}
                    />
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      selectExercise(exercise);
                    }}
                    type="button"
                  >
                    Add
                  </button>
                </span>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

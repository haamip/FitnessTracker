import { useEffect, useMemo, useState } from "react";
import { Dumbbell } from "lucide-react";
import { exerciseLibrary } from "../../data/exerciseLibrary";
import { exerciseImageMap } from "../../data/exerciseImageMap";

const FALLBACK_EXERCISE_IMAGE = "/exercise-images/trackfit-fallback.svg";

/**
 * normaliseText
 *
 * Converts exercise names and IDs into a predictable comparison format.
 * This lets TrackFit match saved workout exercises back to the exercise
 * library even when older workout records only stored a name.
 */
function normaliseText(value) {
  return String(value || "").trim().toLowerCase();
}

/**
 * slugify
 *
 * Matches the slug style used by TrackFit's exercise importer and the image
 * mapper script. This gives the image resolver a reliable fallback key.
 */
function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * findLibraryExercise
 *
 * Looks up the full library exercise from a partial workout exercise.
 * Workout records can come from manual logging, the Workout Builder, seed data,
 * or older saved localStorage records, so this helper checks several keys.
 */
function findLibraryExercise(exercise) {
  const exerciseId = normaliseText(exercise?.libraryId || exercise?.id);
  const exerciseSlug = normaliseText(exercise?.slug || exercise?.imageKey);
  const exerciseName = normaliseText(exercise?.name);

  return exerciseLibrary.find((libraryExercise) => {
    return (
      normaliseText(libraryExercise.id) === exerciseId ||
      normaliseText(libraryExercise.slug) === exerciseSlug ||
      normaliseText(libraryExercise.name) === exerciseName
    );
  });
}

/**
 * resolveExerciseImageEntry
 *
 * Finds a generated image-map entry by the best available exercise key.
 * The mapper exists because the workout library and illustration library come
 * from different sources, so filenames do not always match exercise names.
 */
function resolveExerciseImageEntry(exercise) {
  const libraryExercise = findLibraryExercise(exercise);
  const candidateKeys = [
    exercise?.imageKey,
    exercise?.libraryId,
    exercise?.id,
    exercise?.slug,
    libraryExercise?.id,
    libraryExercise?.slug,
    slugify(exercise?.name),
    slugify(libraryExercise?.name),
  ].filter(Boolean);

  for (const key of candidateKeys) {
    const directMatch = exerciseImageMap[key];
    const slugMatch = exerciseImageMap[slugify(key)];

    if (directMatch) return directMatch;
    if (slugMatch) return slugMatch;
  }

  return null;
}

/**
 * resolveExerciseImageSource
 *
 * Chooses the best available image source for an exercise.
 * Priority:
 * 1. generated image-map match,
 * 2. explicit exercise.image value,
 * 3. matching exercise library image,
 * 4. TrackFit branded fallback.
 */
export function resolveExerciseImageSource(exercise) {
  const mappedEntry = resolveExerciseImageEntry(exercise);

  if (mappedEntry?.primary) {
    return mappedEntry.primary;
  }

  if (exercise?.image && exercise.image !== "TF") {
    return exercise.image;
  }

  const libraryExercise = findLibraryExercise(exercise);
  return libraryExercise?.image || FALLBACK_EXERCISE_IMAGE;
}

/**
 * ExerciseImage
 *
 * Reusable exercise artwork component.
 * Handles generated image mappings, lazy loading, missing image fallbacks, and
 * consistent sizing across the Workout Builder, exercise picker, workout cards,
 * and live workout logger.
 */
export default function ExerciseImage({
  exercise,
  className = "tf-exercise-art",
  fallbackLabel = "TF",
  size = 44,
}) {
  const imageSource = useMemo(() => resolveExerciseImageSource(exercise), [exercise]);
  const [activeSource, setActiveSource] = useState(imageSource);
  const [showFallbackIcon, setShowFallbackIcon] = useState(false);

  /*
    Reset the image state whenever the exercise changes.
    Without this, a failed image on one card could keep showing the fallback
    when React reuses the component for another exercise.
  */
  useEffect(() => {
    setActiveSource(imageSource);
    setShowFallbackIcon(false);
  }, [imageSource]);

  function handleImageError() {
    if (activeSource !== FALLBACK_EXERCISE_IMAGE) {
      setActiveSource(FALLBACK_EXERCISE_IMAGE);
      return;
    }

    setShowFallbackIcon(true);
  }

  return (
    <span
      aria-hidden="true"
      className={className}
      style={{ "--tf-exercise-image-size": `${size}px` }}
    >
      {showFallbackIcon ? (
        <span className="tf-exercise-fallback">
          <Dumbbell size={20} />
          <small>{fallbackLabel}</small>
        </span>
      ) : (
        <img
          alt=""
          loading="lazy"
          src={activeSource}
          onError={handleImageError}
        />
      )}
    </span>
  );
}

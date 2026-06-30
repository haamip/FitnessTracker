import { useMemo, useState } from "react";
import { Dumbbell } from "lucide-react";
import { FALLBACK_EXERCISE_IMAGE, resolveExerciseImage } from "../../services/exerciseResolver";

/**
 * ExerciseImage
 *
 * Reusable exercise artwork with safe fallback handling.
 * Keying the img by source lets React reset failed-image state without a sync setState effect.
 */
export default function ExerciseImage({
  exercise,
  className = "tf-exercise-art",
  fallbackLabel = "TF",
  size = 44,
}) {
  const imageSource = useMemo(() => resolveExerciseImage(exercise), [exercise]);
  const [failedSources, setFailedSources] = useState(() => new Set());

  const shouldUseFallbackImage = failedSources.has(imageSource);
  const activeSource = shouldUseFallbackImage ? FALLBACK_EXERCISE_IMAGE : imageSource;
  const showFallbackIcon = failedSources.has(FALLBACK_EXERCISE_IMAGE);

  function handleImageError() {
    setFailedSources((currentSources) => {
      if (currentSources.has(activeSource)) {
        return currentSources;
      }

      const nextSources = new Set(currentSources);
      nextSources.add(activeSource);
      return nextSources;
    });
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
        <img alt="" key={activeSource} loading="lazy" src={activeSource} onError={handleImageError} />
      )}
    </span>
  );
}
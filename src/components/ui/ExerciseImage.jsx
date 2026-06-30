import { useEffect, useMemo, useState } from "react";
import { Dumbbell } from "lucide-react";
import { FALLBACK_EXERCISE_IMAGE, resolveExerciseImage } from "../../services/exerciseResolver";

/**
 * ExerciseImage
 *
 * Single reusable artwork component for every exercise surface in TrackFit.
 * It uses the Exercise Resolver so exercise variations can share a sensible
 * family image instead of relying on exact exercise-name filename matches.
 */
export default function ExerciseImage({
  exercise,
  className = "tf-exercise-art",
  fallbackLabel = "TF",
  size = 44,
}) {
  const imageSource = useMemo(() => resolveExerciseImage(exercise), [exercise]);
  const [activeSource, setActiveSource] = useState(imageSource);
  const [showFallbackIcon, setShowFallbackIcon] = useState(false);

  /**
   * Reset image state whenever React reuses this component for another card.
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
        <img alt="" loading="lazy" src={activeSource} onError={handleImageError} />
      )}
    </span>
  );
}

import { ChevronRight } from "lucide-react";
import ExerciseImage from "./ExerciseImage";

/**
 * ExerciseCard
 *
 * Reusable compact exercise card used by supporting workout screens.
 * The live Train page uses the same ExerciseImage pipeline, so every screen
 * now has consistent artwork, fallback handling, and readable card layout.
 */
export default function ExerciseCard({
  name,
  target,
  sets = [],
  image,
  exercise,
  onClick,
}) {
  const cardExercise = exercise || { name, image };
  const completedSets = sets.filter((set, index) => {
    if (typeof set === "object") {
      return Boolean(set.done);
    }

    return index === 0;
  }).length;

  return (
    <section className="tf-compact-exercise-card">
      <button
        className="tf-compact-exercise-card__button"
        onClick={onClick}
        type="button"
      >
        <ExerciseImage
          className="tf-compact-exercise-card__image"
          exercise={cardExercise}
          size={48}
        />

        <span className="tf-compact-exercise-card__body">
          <strong>{name}</strong>
          <small>{target}</small>
          {sets.length > 0 && (
            <em>
              {completedSets}/{sets.length} sets complete
            </em>
          )}
        </span>

        <ChevronRight size={20} aria-hidden="true" />
      </button>
    </section>
  );
}

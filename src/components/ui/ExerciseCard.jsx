import { ChevronRight } from "lucide-react";

/**
 * ExerciseCard
 *
 * Reusable compact exercise card used by supporting workout screens.
 * Keep the exercise name, set target and completion status front and centre.
 */
export default function ExerciseCard({
  name,
  target,
  sets = [],
  onClick,
}) {
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

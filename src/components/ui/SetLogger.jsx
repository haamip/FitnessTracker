import { CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";
import { getPreviousSetLabel } from "../../services/workoutEngine";
import { getTargetSetLabel } from "../../services/progressionEngine";

/**
 * SetLogger
 *
 * Clean mobile-first set logger. The default view focuses on the two fields
 * lifters need mid-session: weight and reps. Advanced effort data remains
 * available behind a details drawer so the workout screen stays tidy on a phone.
 */
export default function SetLogger({
  exercise,
  previousExercise,
  recommendation,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
}) {
  return (
    <section className="tf-simple-set-logger">
      <div className="tf-simple-set-list">
        {exercise.sets.map((set, setIndex) => {
          const previousLabel = getPreviousSetLabel(previousExercise, setIndex);
          const targetLabel = getTargetSetLabel(recommendation, setIndex);

          return (
            <article className={set.done ? "tf-simple-set done" : "tf-simple-set"} key={set.id}>
              <header className="tf-simple-set__head">
                <div>
                  <strong>{set.type === "W" ? "Warm-up" : `Set ${setIndex + 1}`}</strong>
                  <span>Last: {previousLabel} • Target: {targetLabel}</span>
                </div>

                {exercise.sets.length > 1 && (
                  <button
                    aria-label={`Remove set ${setIndex + 1}`}
                    className="tf-simple-set__delete"
                    onClick={() => onRemoveSet(exercise.id, set.id)}
                    type="button"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </header>

              <div className="tf-simple-set__inputs">
                <label>
                  Weight
                  <div>
                    <input
                      aria-label={`${exercise.name} set ${setIndex + 1} weight`}
                      inputMode="decimal"
                      onChange={(event) => onUpdateSet(exercise.id, set.id, "weight", event.target.value)}
                      placeholder="0"
                      value={set.weight}
                    />
                    <span>kg</span>
                  </div>
                </label>

                <label>
                  Reps
                  <input
                    aria-label={`${exercise.name} set ${setIndex + 1} reps`}
                    inputMode="numeric"
                    onChange={(event) => onUpdateSet(exercise.id, set.id, "reps", event.target.value)}
                    placeholder="8"
                    value={set.reps}
                  />
                </label>
              </div>

              <button
                className={set.done ? "tf-simple-complete done" : "tf-simple-complete"}
                onClick={() => onUpdateSet(exercise.id, set.id, "done", !set.done)}
                type="button"
              >
                {set.done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                {set.done ? "Completed" : "Complete Set"}
              </button>

              <details className="tf-set-advanced">
                <summary>Advanced</summary>

                <div className="tf-set-advanced__grid">
                  <label>
                    Type
                    <select
                      aria-label={`${exercise.name} set ${setIndex + 1} type`}
                      onChange={(event) => onUpdateSet(exercise.id, set.id, "type", event.target.value)}
                      value={set.type}
                    >
                      <option value="S">Working</option>
                      <option value="W">Warm-up</option>
                      <option value="D">Drop</option>
                      <option value="F">Failure</option>
                    </select>
                  </label>

                  <label>
                    RPE
                    <input
                      inputMode="decimal"
                      placeholder="8"
                      value={set.rpe || ""}
                      onChange={(event) => onUpdateSet(exercise.id, set.id, "rpe", event.target.value)}
                    />
                  </label>

                  <label>
                    RIR
                    <input
                      inputMode="numeric"
                      placeholder="2"
                      value={set.rir || ""}
                      onChange={(event) => onUpdateSet(exercise.id, set.id, "rir", event.target.value)}
                    />
                  </label>

                  <label className="tf-set-advanced__failure">
                    <input
                      checked={Boolean(set.failure)}
                      onChange={(event) => onUpdateSet(exercise.id, set.id, "failure", event.target.checked)}
                      type="checkbox"
                    />
                    Failure
                  </label>
                </div>

                <input
                  className="tf-set-note-input"
                  placeholder="Set note"
                  value={set.note || ""}
                  onChange={(event) => onUpdateSet(exercise.id, set.id, "note", event.target.value)}
                />
              </details>
            </article>
          );
        })}
      </div>

      <button className="tf-add-set-btn" onClick={() => onAddSet(exercise.id)} type="button">
        <Plus size={19} />
        Add Set
      </button>
    </section>
  );
}

import { CheckCircle2, Circle, Plus, RotateCcw, Trash2 } from "lucide-react";
import { getPreviousSetLabel } from "../../services/workoutEngine";
import { getTargetSetLabel } from "../../services/engines/progressionEngine";
import "./SetLogger.css";

/**
 * SetLogger
 *
 * Commercial mobile-first set logger.
 *
 * The logger now behaves more like a proper gym companion:
 * - completed sets collapse into a tidy summary row
 * - the next unfinished set becomes the visual focus
 * - weight/reps stay large and thumb-friendly
 * - advanced data remains available without cluttering the workout flow
 */
export default function SetLogger({
  exercise,
  previousExercise,
  recommendation,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
}) {
  const firstIncompleteSetIndex = exercise.sets.findIndex((set) => !set.done);

  return (
    <section className="tf-simple-set-logger">
      <div className="tf-set-flow-head">
        <div>
          <strong>Sets</strong>
          <span>
            {firstIncompleteSetIndex === -1
              ? "All sets complete"
              : `Next up: set ${firstIncompleteSetIndex + 1}`}
          </span>
        </div>
      </div>

      {/* Set list: completed sets collapse so the next set stays obvious. */}
      <div className="tf-simple-set-list">
        {exercise.sets.map((set, setIndex) => {
          const previousLabel = getPreviousSetLabel(previousExercise, setIndex);
          const targetLabel = getTargetSetLabel(recommendation, setIndex);
          const setLabel = set.type === "W" ? "Warm-up" : `Set ${setIndex + 1}`;
          const isActiveSet = firstIncompleteSetIndex === setIndex;
          const isCollapsedCompleteSet = set.done && !isActiveSet;
          const setCardClassName = [
            "tf-simple-set",
            set.done ? "done" : "",
            isActiveSet ? "active" : "",
            isCollapsedCompleteSet ? "collapsed" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <article className={setCardClassName} key={set.id}>
              <header className="tf-simple-set__head">
                <div>
                  <strong>{setLabel}</strong>
                  <span>
                    Last: {previousLabel} - Target: {targetLabel}
                  </span>
                </div>

                {exercise.sets.length > 1 && !isCollapsedCompleteSet && (
                  <button
                    aria-label={`Remove ${setLabel}`}
                    className="tf-simple-set__delete"
                    onClick={() => onRemoveSet(exercise.id, set.id)}
                    type="button"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </header>

              {isCollapsedCompleteSet ? (
                <div className="tf-completed-set-row">
                  <span>
                    {set.weight || "-"} kg x {set.reps || "-"} reps
                  </span>
                  <button
                    onClick={() =>
                      onUpdateSet(exercise.id, set.id, "done", false)
                    }
                    type="button"
                  >
                    <RotateCcw size={15} /> Undo
                  </button>
                </div>
              ) : (
                <>
                  {/* Primary logging controls: keep these big, clear and fast. */}
                  <div className="tf-simple-set__inputs">
                    <label>
                      Weight
                      <div>
                        <input
                          aria-label={`${exercise.name} ${setLabel} weight`}
                          inputMode="decimal"
                          onChange={(event) =>
                            onUpdateSet(
                              exercise.id,
                              set.id,
                              "weight",
                              event.target.value,
                            )
                          }
                          placeholder="Weight"
                          value={
                            set.weight === "0" || set.weight === 0
                              ? ""
                              : set.weight
                          }
                        />
                        <span>kg</span>
                      </div>
                    </label>

                    <label>
                      Reps
                      <input
                        aria-label={`${exercise.name} ${setLabel} reps`}
                        inputMode="numeric"
                        onChange={(event) =>
                          onUpdateSet(
                            exercise.id,
                            set.id,
                            "reps",
                            event.target.value,
                          )
                        }
                        placeholder="Reps"
                        value={set.reps === "8-12" ? "" : set.reps}
                      />
                    </label>
                  </div>

                  <button
                    className={
                      set.done
                        ? "tf-simple-complete done"
                        : "tf-simple-complete"
                    }
                    onClick={() =>
                      onUpdateSet(exercise.id, set.id, "done", !set.done)
                    }
                    type="button"
                  >
                    {set.done ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      <Circle size={20} />
                    )}
                    {set.done ? "Completed" : "Complete Set"}
                  </button>

                  {/* Advanced data stays available without cluttering the main logger. */}
                  <details className="tf-set-advanced">
                    <summary>Advanced</summary>

                    <div className="tf-set-advanced__grid">
                      <label>
                        Type
                        <select
                          aria-label={`${exercise.name} ${setLabel} type`}
                          onChange={(event) =>
                            onUpdateSet(
                              exercise.id,
                              set.id,
                              "type",
                              event.target.value,
                            )
                          }
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
                          onChange={(event) =>
                            onUpdateSet(
                              exercise.id,
                              set.id,
                              "rpe",
                              event.target.value,
                            )
                          }
                          placeholder="Reps"
                          value={set.rpe || ""}
                        />
                      </label>

                      <label>
                        RIR
                        <input
                          inputMode="numeric"
                          onChange={(event) =>
                            onUpdateSet(
                              exercise.id,
                              set.id,
                              "rir",
                              event.target.value,
                            )
                          }
                          placeholder="2"
                          value={set.rir || ""}
                        />
                      </label>

                      <label className="tf-set-advanced__failure">
                        <input
                          checked={Boolean(set.failure)}
                          onChange={(event) =>
                            onUpdateSet(
                              exercise.id,
                              set.id,
                              "failure",
                              event.target.checked,
                            )
                          }
                          type="checkbox"
                        />
                        Failure
                      </label>
                    </div>

                    <input
                      className="tf-set-note-input"
                      onChange={(event) =>
                        onUpdateSet(
                          exercise.id,
                          set.id,
                          "note",
                          event.target.value,
                        )
                      }
                      placeholder="Set note"
                      value={set.note || ""}
                    />
                  </details>
                </>
              )}
            </article>
          );
        })}
      </div>

      <button
        className="tf-add-set-btn"
        onClick={() => onAddSet(exercise.id)}
        type="button"
      >
        <Plus size={19} />
        Add Set
      </button>
    </section>
  );
}

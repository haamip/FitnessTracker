import { Circle, Plus, Trash2 } from "lucide-react";
import { getPreviousSetLabel } from "../../services/workoutEngine";
import { getTargetSetLabel } from "../../services/progressionEngine";

/**
 * SetLogger
 *
 * Reusable set logging table for TrackFit's live workout screen.
 * Keeps weight, reps, type, effort tracking, notes, completion, and deletion
 * in one component so every workout page uses the same logging behaviour.
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
    <>
      {/* Pro logging legend: W = warm-up, S = standard, D = drop set, F = failure set. */}
      <div className="tf-pro-legend">
        <span>W Warm-up</span>
        <span>S Working</span>
        <span>D Drop</span>
        <span>F Failure</span>
      </div>

      <div className="tf-sets-head intelligence">
        <span>Set</span>
        <span>Last</span>
        <span>Target</span>
        <span>Weight</span>
        <span>Reps</span>
        <span>Type</span>
        <span>Done</span>
      </div>

      <div className="tf-set-list">
        {exercise.sets.map((set, setIndex) => (
          <div className="tf-set-block" key={set.id}>
            <div className={set.done ? "tf-set-row intelligence done" : "tf-set-row intelligence"}>
              <span>{set.type === "W" ? "WU" : setIndex + 1}</span>

              <small>{getPreviousSetLabel(previousExercise, setIndex)}</small>
              <small>{getTargetSetLabel(recommendation, setIndex)}</small>

              <input
                aria-label={`${exercise.name} set ${setIndex + 1} weight`}
                inputMode="decimal"
                onChange={(event) => onUpdateSet(exercise.id, set.id, "weight", event.target.value)}
                value={set.weight}
              />

              <input
                aria-label={`${exercise.name} set ${setIndex + 1} reps`}
                inputMode="numeric"
                onChange={(event) => onUpdateSet(exercise.id, set.id, "reps", event.target.value)}
                value={set.reps}
              />

              <select
                aria-label={`${exercise.name} set ${setIndex + 1} type`}
                onChange={(event) => onUpdateSet(exercise.id, set.id, "type", event.target.value)}
                value={set.type}
              >
                <option value="S">S</option>
                <option value="W">W</option>
                <option value="D">D</option>
                <option value="F">F</option>
              </select>

              <button
                aria-label={`Mark set ${setIndex + 1} done`}
                className="tf-done-btn"
                onClick={() => onUpdateSet(exercise.id, set.id, "done", !set.done)}
                type="button"
              >
                <Circle size={22} />
              </button>

              {exercise.sets.length > 1 && (
                <button
                  aria-label={`Remove set ${setIndex + 1}`}
                  className="tf-remove-set-btn"
                  onClick={() => onRemoveSet(exercise.id, set.id)}
                  type="button"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>

            {/* Optional effort fields for lifters who want deeper tracking. */}
            <div className="tf-set-extra-row">
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

              <label className="tf-failure-toggle">
                <input
                  checked={Boolean(set.failure)}
                  onChange={(event) => onUpdateSet(exercise.id, set.id, "failure", event.target.checked)}
                  type="checkbox"
                />
                Failure
              </label>

              <input
                className="tf-set-note-input"
                placeholder="Set note"
                value={set.note || ""}
                onChange={(event) => onUpdateSet(exercise.id, set.id, "note", event.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      <button className="tf-add-set-btn" onClick={() => onAddSet(exercise.id)} type="button">
        <Plus size={19} />
        Add Set
      </button>
    </>
  );
}

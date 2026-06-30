import { Pause, Play, SkipForward } from "lucide-react";
import { formatClock } from "../../services/workoutEngine";

/**
 * RestTimer
 *
 * Shared rest timer UI used by the live workout logger.
 * The countdown logic still lives in WorkoutDetail for now, while this
 * component owns the presentation and controls.
 */
export default function RestTimer({
  activeRestLabel,
  restCompletedMessage,
  restRunning,
  restSeconds,
  onAddTime,
  onSkip,
  onToggle,
}) {
  return (
    <div className={restRunning ? "tf-rest-card running" : "tf-rest-card"}>
      <div>
        <strong>AUTO REST TIMER</strong>
        <small>{activeRestLabel}</small>
        <span>{formatClock(restSeconds)}</span>
        <em>{restCompletedMessage || "Tick a set done to start rest automatically."}</em>
      </div>

      <div className="tf-rest-controls">
        <button
          aria-label={restRunning ? "Pause rest timer" : "Resume rest timer"}
          className="tf-play-btn"
          onClick={onToggle}
          type="button"
        >
          {restRunning ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
        </button>

        <button onClick={() => onAddTime(15)} type="button">
          +15s
        </button>

        <button onClick={onSkip} type="button">
          <SkipForward size={15} /> Skip
        </button>
      </div>
    </div>
  );
}

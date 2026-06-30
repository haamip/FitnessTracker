import { Pause, Play, SkipForward, TimerReset } from "lucide-react";
import { formatClock } from "../../services/workoutEngine";

/**
 * RestTimer
 *
 * Premium bottom-sheet style rest timer used inside Gym Mode.
 * WorkoutDetail owns the countdown state; this component keeps the UI focused,
 * thumb-friendly, and visually obvious during live training.
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
  const isActive = restRunning || restSeconds > 0 || Boolean(restCompletedMessage);

  return (
    <section className={isActive ? "tf-rest-sheet active" : "tf-rest-sheet"}>
      <div className="tf-rest-sheet__handle" />

      <div className="tf-rest-sheet__head">
        <div>
          <strong>{restRunning ? "Rest timer" : "Rest ready"}</strong>
          <span>{activeRestLabel}</span>
        </div>

        <div className="tf-rest-sheet__icon">
          <TimerReset size={21} />
        </div>
      </div>

      <div className="tf-rest-sheet__time">{formatClock(restSeconds)}</div>

      <p>{restCompletedMessage || "Complete a set and TrackFit will start your rest automatically."}</p>

      <div className="tf-rest-sheet__actions">
        <button className="primary" onClick={onToggle} type="button">
          {restRunning ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}
          {restRunning ? "Pause" : "Resume"}
        </button>

        <button onClick={() => onAddTime(30)} type="button">
          +30 sec
        </button>

        <button onClick={onSkip} type="button">
          <SkipForward size={16} />
          Skip
        </button>
      </div>
    </section>
  );
}
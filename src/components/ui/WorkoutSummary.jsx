import { Clock3, Dumbbell, Flame } from "lucide-react";
import { formatClock } from "../../services/workoutEngine";

/**
 * WorkoutSummary
 *
 * Compact live summary for the workout logger.
 * This gives TrackFit one reusable place to show duration, total volume,
 * completed sets, and remaining work while the user trains.
 */
export default function WorkoutSummary({ seconds, totals }) {
  const setsLeft = Math.max((totals?.totalSets || 0) - (totals?.doneSets || 0), 0);

  return (
    <div className="tf-workout-summary">
      <article>
        <Clock3 size={18} />
        <strong>{formatClock(seconds)}</strong>
        <span>Duration</span>
      </article>

      <article>
        <Dumbbell size={18} />
        <strong>{Math.round(totals?.volume || 0)}</strong>
        <span>Volume kg</span>
      </article>

      <article>
        <Flame size={18} />
        <strong>{setsLeft}</strong>
        <span>Sets left</span>
      </article>
    </div>
  );
}

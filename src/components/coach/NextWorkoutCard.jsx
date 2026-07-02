/**
 * ============================================================================
 * NextWorkoutCard.jsx
 * ============================================================================
 *
 * Difficulty
 * ⭐⭐☆☆☆
 *
 * PURPOSE
 * -------
 * Shows the workout the Coach recommends next.
 *
 * This component does not decide the workout.
 * It only displays what the Coach Intelligence Engine gives it.
 *
 * ============================================================================
 */

import { ChevronRight, Dumbbell } from "lucide-react";
import { Link } from "react-router-dom";
import TrackFitCard from "../common/TrackFitCard";

export default function NextWorkoutCard({ recommendation }) {
  const workout = recommendation?.workout ?? "Workout 1";
  const reason = recommendation?.reason ?? "No recommendation available yet.";
  const route = recommendation?.route ?? "/workouts/workout-1";

  return (
    <TrackFitCard
      eyebrow="Next workout"
      title={workout}
      icon={<Dumbbell size={22} />}
      className="coach-next-workout-card"
    >
      <p>{reason}</p>

      <Link className="coach-card-link" to={route}>
        Start workout <ChevronRight size={18} />
      </Link>
    </TrackFitCard>
  );
}
/**
 * ============================================================================
 * NextWorkoutCard.jsx
 * ============================================================================
 *
 * Difficulty
 * ----------
 * 3/5
 *
 * PURPOSE
 * -------
 * Shows the workout the Coach recommends next.
 *
 * Why this exists
 * ---------------
 * The Coach engine decides the recommendation.
 * This card explains the decision and gives the user one clear action.
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
      eyebrow="Recommended next"
      title={workout}
      icon={<Dumbbell size={22} />}
      className="coach-next-workout-card"
    >
      <div className="coach-recommendation-box">
        <span>Why this workout?</span>
        <p>{reason}</p>
      </div>

      <Link className="coach-card-link" to={route}>
        Start recommended workout <ChevronRight size={18} />
      </Link>
    </TrackFitCard>
  );
}

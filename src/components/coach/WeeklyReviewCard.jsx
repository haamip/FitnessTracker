/**
 * ============================================================================
 * WeeklyReviewCard.jsx
 * ============================================================================
 *
 * Difficulty
 * ⭐⭐☆☆☆
 *
 * PURPOSE
 * -------
 * Shows the user's weekly training score.
 *
 * Later this will become the Sunday review:
 *
 * - workouts completed
 * - PRs
 * - total volume
 * - consistency
 * - strongest lift
 * - area to improve
 *
 * ============================================================================
 */

import { Trophy } from "lucide-react";
import TrackFitCard from "../common/TrackFitCard";

export default function WeeklyReviewCard({ weeklyReview }) {
  const score = weeklyReview?.score ?? 0;
  const message = weeklyReview?.message ?? "No weekly review available yet.";

  return (
    <TrackFitCard
      eyebrow="Weekly review"
      title={`${score}/100`}
      icon={<Trophy size={22} />}
      className="coach-weekly-review-card"
    >
      <p>{message}</p>
    </TrackFitCard>
  );
}
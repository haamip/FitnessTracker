/**
 * ============================================================================
 * WeeklySummaryCard.jsx
 * ============================================================================
 *
 * Difficulty
 * ⭐⭐☆☆☆
 *
 * PURPOSE
 * -------
 * Shows this week's training summary.
 *
 * This card helps the user quickly answer:
 *
 * "Am I training consistently this week?"
 *
 * ============================================================================
 */

import { Repeat } from "lucide-react";
import TrackFitCard from "../common/TrackFitCard";

export default function WeeklySummaryCard({ weeklySummary }) {
  const sessions = weeklySummary?.sessions ?? 0;
  const volume = weeklySummary?.volume ?? 0;
  const message = weeklySummary?.message ?? "No weekly training data yet.";

  return (
    <TrackFitCard
      eyebrow="Weekly summary"
      title={`${sessions} sessions`}
      icon={<Repeat size={22} />}
      className="coach-weekly-summary-card"
    >
      <div className="coach-big-number">
        <strong>{volume.toLocaleString()} kg</strong>
        <span>Total volume</span>
      </div>

      <p>{message}</p>
    </TrackFitCard>
  );
}
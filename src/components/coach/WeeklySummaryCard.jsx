/**
 * ============================================================================
 * WeeklySummaryCard.jsx
 * ============================================================================
 *
 * Difficulty
 * ----------
 * ⭐⭐☆☆☆
 *
 * PURPOSE
 * -------
 * Shows this week's training summary from the Coach Intelligence engine.
 *
 * Why this exists
 * ---------------
 * The engine calculates the numbers.
 * This card only displays them clearly.
 *
 * ============================================================================
 */

import { Repeat } from "lucide-react";
import TrackFitCard from "../common/TrackFitCard";

export default function WeeklySummaryCard({ weeklySummary }) {
  const sessions = weeklySummary?.sessions ?? 0;
  const volume = weeklySummary?.volume ?? 0;
  const sets = weeklySummary?.sets ?? 0;
  const durationMinutes = weeklySummary?.durationMinutes ?? 0;
  const prs = weeklySummary?.prs ?? 0;
  const mostTrainedMuscle = weeklySummary?.mostTrainedMuscle ?? "Not enough data yet";
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
        <span>Total weekly volume</span>
      </div>

      <div className="coach-mini-stat-list">
        <p>Sets: {sets}</p>
        <p>Time: {durationMinutes} min</p>
        <p>PR signals: {prs}</p>
        <p>Most trained: {mostTrainedMuscle}</p>
      </div>

      <p>{message}</p>
    </TrackFitCard>
  );
}
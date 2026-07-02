/**
 * ============================================================================
 * ReadinessCard.jsx
 * ============================================================================
 *
 * Difficulty
 * ----------
 * 3/5
 * PURPOSE
 * -------
 * Shows the user's current training readiness.
 *
 * This card does NOT calculate readiness.
 * It only receives readiness data and displays it.
 *
 * That means:
 *
 * coachIntelligenceEngine.js = does the thinking
 * ReadinessCard.jsx = shows the result
 *
 * ============================================================================
 */

import { Gauge } from "lucide-react";
import TrackFitCard from "../common/TrackFitCard";

export default function ReadinessCard({ readiness }) {
  const score = readiness?.score ?? 0;
  const status = readiness?.status ?? "Unknown";
  const reason = readiness?.reason ?? "No readiness data available yet.";

  return (
    <TrackFitCard
      eyebrow="Readiness"
      title={status}
      icon={<Gauge size={22} />}
      className="coach-readiness-card"
    >
      <div className="coach-readiness-score">
        <strong>{score}%</strong>
        <span>Training readiness</span>
      </div>

      <div className="coach-readiness-bar">
        <i style={{ width: `${score}%` }} />
      </div>

      <p>{reason}</p>
    </TrackFitCard>
  );
}

/**
 * ============================================================================
 * FatigueCard.jsx
 * ============================================================================
 *
 * Difficulty
 * ----------
 * 3/5
 * PURPOSE
 * -------
 * Shows whether the user may be carrying too much training fatigue.
 *
 * Fatigue matters because progress does not come from smashing yourself every
 * day. It comes from training hard, recovering, then repeating.
 *
 * ============================================================================
 */

import { ShieldAlert } from "lucide-react";
import TrackFitCard from "../common/TrackFitCard";

export default function FatigueCard({ fatigue }) {
  const level = fatigue?.level ?? "Unknown";
  const advice = fatigue?.advice ?? "No fatigue data available yet.";

  return (
    <TrackFitCard
      eyebrow="Fatigue"
      title={level}
      icon={<ShieldAlert size={22} />}
      className="coach-fatigue-card"
    >
      <p>{advice}</p>
    </TrackFitCard>
  );
}

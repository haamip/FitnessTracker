/**
 * ============================================================================
 * PlateauCard.jsx
 * ============================================================================
 *
 * Difficulty
 * ⭐⭐☆☆☆
 *
 * PURPOSE
 * -------
 * Shows whether TrackFit thinks progress may be stalling.
 *
 * A plateau means the user may not be improving on an exercise or training area.
 *
 * This card does not calculate the plateau.
 * It only displays what the Coach Intelligence Engine gives it.
 *
 * ============================================================================
 */

import { Brain } from "lucide-react";
import TrackFitCard from "../common/TrackFitCard";

export default function PlateauCard({ plateau }) {
  const detected = plateau?.detected ?? false;
  const message = plateau?.message ?? "No plateau data available yet.";

  return (
    <TrackFitCard
      eyebrow="Plateau watch"
      title={detected ? "Plateau detected" : "No plateau"}
      icon={<Brain size={22} />}
      className="coach-plateau-card"
    >
      <p>{message}</p>
    </TrackFitCard>
  );
}
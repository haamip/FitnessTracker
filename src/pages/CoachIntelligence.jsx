/**
 * ============================================================================
 * TrackFit Coach Intelligence Page
 * ============================================================================
 *
 * PURPOSE
 * -------
 * This page DISPLAYs the Coach Intelligence data.
 *
 * It does not calculate the advice itself.
 *
 * The advice comes from:
 *
 * src/services/coachIntelligenceEngine.js
 *
 * Think of it like this:
 *
 * Engine = brain
 * Page = face
 *
 * The brain decides.
 * The page shows.
 *
 * ============================================================================
 */

import {
  ReadinessCard,
  NextWorkoutCard,
  WeeklySummaryCard,
  FatigueCard,
  PlateauCard,
  WeeklyReviewCard,
} from "../components/coach";
import { buildCoachDashboard } from "../services/coachIntelligenceEngine";
import "./CoachIntelligence.css";

export default function CoachIntelligence() {
  /**
   * This calls the Coach engine.
   *
   * The page gets one clean object back with everything it needs.
   */
  const coach = buildCoachDashboard();

  return (
    <main className="coach-intelligence-page">
      <section className="coach-hero">
        <p className="eyebrow">TrackFit Intelligence</p>
        <h1>Coach Brain</h1>
        <span>
          Training advice built from readiness, fatigue, weekly progress and workout history.
        </span>
      </section>

    
       <section className="coach-grid">

  <ReadinessCard
    readiness={coach.readiness}
  />

  <NextWorkoutCard
    recommendation={coach.recommendation}
  />

  <WeeklySummaryCard
    weeklySummary={coach.weeklySummary}
  />

  <FatigueCard
    fatigue={coach.fatigue}
  />

  <PlateauCard
    plateau={coach.plateau}
  />

  <WeeklyReviewCard
    weeklyReview={coach.weeklyReview}
  />

</section>
    </main>
  );
}
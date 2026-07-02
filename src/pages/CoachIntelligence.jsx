/**
 * ============================================================================
 * TrackFit Coach Intelligence Page
 * ============================================================================
 *
 * PURPOSE
 * -------
 * Displays the real Coach Intelligence engine output.
 *
 * Difficulty
 * ----------
 * ⭐⭐☆☆☆
 *
 * Why this exists
 * ---------------
 * The engine does the thinking.
 * This page only lays out the result.
 *
 * Data flow:
 *
 * Repositories
 * ↓
 * coachIntelligenceEngine.js
 * ↓
 * Reusable Coach cards
 * ↓
 * This page
 *
 * ============================================================================
 */

import {
  FatigueCard,
  NextWorkoutCard,
  PlateauCard,
  ReadinessCard,
  WeeklyReviewCard,
  WeeklySummaryCard,
} from "../components/coach";
import { buildCoachDashboard } from "../services/coachIntelligenceEngine";
import "./CoachIntelligence.css";

export default function CoachIntelligence() {
  const coach = buildCoachDashboard();

  return (
    <main className="coach-intelligence-page">
      <section className="coach-hero">
        <p className="eyebrow">TrackFit Intelligence</p>
        <h1>Coach Brain</h1>
        <span>
          Training advice built from your workout history, readiness, fatigue,
          weekly progress and recovery signals.
        </span>
      </section>

      <section className="coach-grid">
        <ReadinessCard readiness={coach.readiness} />
        <NextWorkoutCard recommendation={coach.recommendation} />
        <WeeklySummaryCard weeklySummary={coach.weeklySummary} />
        <FatigueCard fatigue={coach.fatigue} />
        <PlateauCard plateau={coach.plateau} />
        <WeeklyReviewCard weeklyReview={coach.weeklyReview} />
      </section>
    </main>
  );
}
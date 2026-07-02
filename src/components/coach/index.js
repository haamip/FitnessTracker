/**
 * ============================================================================
 * Coach Components Export File
 * ============================================================================
 *
 * Difficulty
 * ----------
 * 3/5
 * PURPOSE
 * -------
 * This file lets us import all Coach cards from one place.
 *
 * Instead of this:
 *
 * import ReadinessCard from "../components/coach/ReadinessCard";
 * import NextWorkoutCard from "../components/coach/NextWorkoutCard";
 *
 * We can do this:
 *
 * import { ReadinessCard, NextWorkoutCard } from "../components/coach";
 *
 * Cleaner imports. Less clutter.
 *
 * ============================================================================
 */

export { default as ReadinessCard } from "./ReadinessCard";
export { default as NextWorkoutCard } from "./NextWorkoutCard";
export { default as WeeklySummaryCard } from "./WeeklySummaryCard";
export { default as FatigueCard } from "./FatigueCard";
export { default as PlateauCard } from "./PlateauCard";
export { default as WeeklyReviewCard } from "./WeeklyReviewCard";

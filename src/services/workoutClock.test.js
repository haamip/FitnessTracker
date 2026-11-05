import { beforeEach, describe, expect, it } from "vitest";
import {
  workoutClockKey, getOrStartWorkoutClock, getResumableWorkoutClock, readWorkoutClock,
  elapsedWorkoutSeconds, clearWorkoutClock, getWorkoutClockSeconds,
  needsWorkoutTimeReview, confirmLongWorkout, hasConfirmedLongWorkout, correctWorkoutClock,
} from "./workoutClock";

const alice = "11111111-1111-4111-8111-111111111111";
const bob = "22222222-2222-4222-8222-222222222222";

describe("persistent workout clock", () => {
  beforeEach(() => localStorage.clear());

  it("measures elapsed time from an absolute start instead of tick counts", () => {
    const started = getOrStartWorkoutClock(alice, "chest-day", 100_000);
    expect(started).toBe(100_000);
    expect(elapsedWorkoutSeconds(started, 145_200)).toBe(45);
    expect(elapsedWorkoutSeconds(started, 145_900)).toBe(45);
  });
  it("resumes after the screen remounts and survives phone lock delays", () => {
    getOrStartWorkoutClock(alice, "chest-day", 100_000);
    const reopened = getOrStartWorkoutClock(alice, "chest-day", 3_700_000);
    expect(reopened).toBe(100_000);
    expect(elapsedWorkoutSeconds(reopened, 3_700_000)).toBe(3600);
  });
  it("separates timers by account and workout, then resets only on completion", () => {
    const key = workoutClockKey(alice, "chest-day");
    getOrStartWorkoutClock(alice, "chest-day", 100_000);
    expect(getOrStartWorkoutClock(alice, "back-day", 200_000)).toBe(200_000);
    expect(getOrStartWorkoutClock(bob, "chest-day", 300_000)).toBe(300_000);
    clearWorkoutClock(alice, "chest-day");
    expect(localStorage.getItem(key)).toBeNull();
    expect(getOrStartWorkoutClock(alice, "chest-day", 400_000)).toBe(400_000);
    expect(getOrStartWorkoutClock(bob, "chest-day", 400_000)).toBe(300_000);
  });

  it("never starts a session just by previewing a workout", () => {
    expect(readWorkoutClock(alice, "chest-day", 100_000)).toBeNull();
    expect(getResumableWorkoutClock(alice, "chest-day", false, 100_000)).toBeNull();
    expect(localStorage.getItem(workoutClockKey(alice, "chest-day"))).toBeNull();
  });

  it("caps the workout at two hours until the user confirms they are still training", () => {
    const start = getOrStartWorkoutClock(alice, "chest-day", 100_000);
    const later = 100_000 + 4 * 60 * 60 * 1000;
    expect(needsWorkoutTimeReview(start, false, later)).toBe(true);
    expect(getWorkoutClockSeconds(start, false, later)).toBe(7200);
    confirmLongWorkout(alice, "chest-day", start);
    expect(hasConfirmedLongWorkout(alice, "chest-day", start)).toBe(true);
    expect(getWorkoutClockSeconds(start, true, later)).toBe(14400);
    clearWorkoutClock(alice, "chest-day");
    expect(hasConfirmedLongWorkout(alice, "chest-day", start)).toBe(false);
  });

  it("allows someone to correct an abandoned workout to their actual minutes", () => {
    getOrStartWorkoutClock(alice, "chest-day", 100_000);
    const now = 100_000 + 20 * 60 * 60 * 1000;
    const corrected = correctWorkoutClock(alice, "chest-day", 45, now);
    expect(getWorkoutClockSeconds(corrected, false, now)).toBe(45 * 60);
    expect(getResumableWorkoutClock(alice, "chest-day", true, now)).toBe(corrected);
    expect(() => correctWorkoutClock(alice, "chest-day", 120, now)).toThrow(/1 and 119/);
  });

  it("expires old previews without logged sets but preserves started workouts", () => {
    getOrStartWorkoutClock(alice, "chest-day", 100_000);
    const later = 100_000 + 13 * 60 * 60 * 1000;
    expect(getResumableWorkoutClock(alice, "chest-day", false, later)).toBeNull();
    const start = getOrStartWorkoutClock(alice, "chest-day", later);
    expect(getResumableWorkoutClock(alice, "chest-day", true, later + 13 * 60 * 60 * 1000)).toBe(start);
  });
  it("rejects corrupt, future or unowned timers", () => {
    expect(() => workoutClockKey("", "some-id")).toThrow(/signed-in/);
    const key = workoutClockKey(alice, "gym");
    localStorage.setItem(key, "broken");
    expect(getOrStartWorkoutClock(alice, "gym", 100_000)).toBe(100_000);
    localStorage.setItem(key, "999999");
    expect(getOrStartWorkoutClock(alice, "gym", 200_000)).toBe(200_000);
    expect(elapsedWorkoutSeconds(300_000, 200_000)).toBe(0);
  });
});

import { beforeEach, describe, expect, it } from "vitest";
import {
  workoutClockKey, getOrStartWorkoutClock, elapsedWorkoutSeconds, clearWorkoutClock,
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

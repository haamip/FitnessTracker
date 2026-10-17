import { describe, expect, it } from "vitest";
import { fromDailyCheckInCloudRow, toDailyCheckInCloudPayload } from "./checkInCloudMapper";

const userId = "2c27e35a-4f21-4a24-8fca-e6f51ae97142";
const now = new Date("2026-10-18T06:00:00Z");

describe("daily check-in cloud persistence", () => {
  it("preserves optional missing values instead of inventing zeros", () => {
    const result = toDailyCheckInCloudPayload({
      date: "2026-10-18",
      mood: "Okay", steps: "", activityType: "rest",
    }, userId, now);
    expect(result).toMatchObject({
      checkin_date: "2026-10-18", steps: null, steps_source: null,
      weight_kg: null, protein_g: null, water_l: null, sleep_hours: null,
      energy: null, trained_today: false, activity_type: "rest",
    });
  });

  it("keeps the source and timestamp of a user-approved watch import", () => {
    const result = toDailyCheckInCloudPayload({
      date: "2026-10-18",
      mood: "Good",
      steps: 11394,
      stepsSource: "health_connect",
      stepsSyncedAt: "2026-10-18T03:34:00Z",
      activityType: "both",
    }, userId, now);
    expect(result).toMatchObject({
      steps: 11394, steps_source: "health_connect",
      steps_synced_at: "2026-10-18T03:34:00.000Z",
      activity_type: "both", trained_today: true,
    });
  });

  it("rejects unsafe step counts and does not fake watch provenance", () => {
    const invalid = toDailyCheckInCloudPayload({
      date: "2026-10-18", steps: 250000, stepsSource: "apple_health", activityType: "rest",
    }, userId, now);
    expect(invalid.steps).toBeNull();
    expect(invalid.steps_source).toBeNull();
    expect(invalid.steps_synced_at).toBeNull();
    const manual = toDailyCheckInCloudPayload({
      date: "2026-10-18", steps: 6000, stepsSource: "spoofed",
    }, userId, now);
    expect(manual.steps_source).toBe("manual");
    expect(manual.steps_synced_at).toBeNull();
  });

  it("round-trips cloud data to workout and weekly review records", () => {
    const record = fromDailyCheckInCloudRow({
      id: "check-in-id",
      checkin_date: "2026-10-18",
      steps: 12030, steps_source: "apple_health",
      steps_synced_at: "2026-10-18T02:00:00Z",
      mood: "Good", trained_today: true, activity_type: "cardio",
      weight_kg: null, protein_g: null, water_l: null, sleep_hours: null,
    });
    expect(record).toMatchObject({
      date: "2026-10-18", steps: 12030, stepsSource: "apple_health",
      activityType: "cardio", trainedToday: true, weightKg: "",
    });
  });
});

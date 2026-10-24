import { describe, expect, it } from "vitest";
import { buildSevenDayCardio, dateKey, lastSevenDays, localDateKey, pacePerKm, recentCardioTotals } from "./cardioSummary";

describe("cardio date and week totals", () => {
  const today = new Date(2026, 9, 24, 12);
  it("keeps seven real calendar dates instead of merging the same weekdays", () => {
    const rows = buildSevenDayCardio([
      { date: "2026-10-24", distanceKm: 2, durationMin: 25 },
      { date: "2026-10-24", distanceKm: 1.4, durationMin: 15 },
      { date: "2026-10-17", distanceKm: 999, durationMin: 180 },
    ], today);
    expect(rows).toHaveLength(7);
    expect(rows.at(-1).date).toMatch(/Sat/);
    expect(rows.at(-1).distance).toBe(3.4);
    expect(rows.reduce((sum, row) => sum + row.distance, 0)).toBe(3.4);
    expect(new Set(lastSevenDays(today).map((row) => row.key)).size).toBe(7);
  });
  it("uses a full local calendar date for UTC-looking strings", () => {
    expect(dateKey("2026-10-23T23:30:00Z")).toBe("2026-10-23");
    expect(localDateKey(today)).toBe("2026-10-24");
  });
  it("only sums past-seven-day manual session steps, not all-time or watch check-in steps", () => {
    const totals = recentCardioTotals([
      { date: "2026-10-24", distanceKm: 1.2, durationMin: 30, calories: 100, steps: 2900 },
      { date: "2026-10-17", distanceKm: 6, durationMin: 90, calories: 500, steps: 8000 },
    ], today);
    expect(totals).toMatchObject({ distanceKm: 1.2, durationMin: 30, calories: 100, sessionSteps: 2900, count: 1 });
  });
  it("handles rounded 60-second paces without displaying 5:60", () => {
    expect(pacePerKm(1, 5.999)).toBe("6:00/km");
    expect(pacePerKm(0, 20)).toBe("Pace pending");
  });
});

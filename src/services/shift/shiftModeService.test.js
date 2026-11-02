import { beforeEach, describe, expect, it } from "vitest";
import { getOperationalDate, getShiftStartTime, setShiftStartTime, setShiftMode } from "./shiftModeService";

describe("custom night-shift reporting days", () => {
  beforeEach(() => {
    localStorage.clear();
    setShiftMode("day");
  });
  it("uses midnight in day mode", () => {
    expect(getOperationalDate(new Date(2026, 10, 2, 2, 0), "day")).toBe("2026-11-02");
  });
  it("uses 6pm by default and stays on previous shift until next 6pm", () => {
    expect(getShiftStartTime()).toBe("18:00");
    expect(getOperationalDate(new Date(2026, 10, 2, 5, 59), "night")).toBe("2026-11-01");
    expect(getOperationalDate(new Date(2026, 10, 2, 17, 59), "night")).toBe("2026-11-01");
    expect(getOperationalDate(new Date(2026, 10, 2, 18, 0), "night")).toBe("2026-11-02");
  });
  it("allows workers to set their own start time", () => {
    setShiftStartTime("19:30");
    expect(getShiftStartTime()).toBe("19:30");
    expect(getOperationalDate(new Date(2026, 10, 2, 19, 29), "night")).toBe("2026-11-01");
    expect(getOperationalDate(new Date(2026, 10, 2, 19, 30), "night")).toBe("2026-11-02");
  });
  it("rejects invalid start times instead of silently changing the window", () => {
    expect(() => setShiftStartTime("25:00")).toThrow(/valid shift start/);
    expect(getShiftStartTime()).toBe("18:00");
  });
});
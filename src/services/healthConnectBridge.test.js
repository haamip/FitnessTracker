import { describe, expect, it, vi } from "vitest";
import { getHealthConnectBridge, readGalaxyDailySteps, validateHealthConnectSteps } from "./healthConnectBridge";

describe("Galaxy Health Connect native boundary", () => {
  it("rejects wrong dates, missing records, and unrealistic data", () => {
    expect(() => validateHealthConnectSteps({ date:"2026-10-16", steps:8000 }, "2026-10-17")).toThrow(/wrong date/);
    expect(() => validateHealthConnectSteps({ date:"2026-10-17", steps:-5 }, "2026-10-17")).toThrow(/invalid/);
    expect(() => validateHealthConnectSteps({ date:"2026-10-17", steps:150001 }, "2026-10-17")).toThrow(/invalid/);
  });
  it("accepts valid aggregated total steps without combining with cardio", () => {
    const actual = validateHealthConnectSteps({ date:"2026-10-17", steps:9842 }, "2026-10-17");
    expect(actual).toMatchObject({ steps:9842, stepsSource:"health_connect" });
  });
  it("prompts for read-only steps consent and refuses denial", async () => {
    const granted = {
      getStatus: vi.fn(async () => ({ available:true, stepsGranted:false })),
      requestPermissions: vi.fn(async () => ({ stepsGranted:true })),
      readTodaySteps: vi.fn(async () => ({ date:"2026-10-17", steps:9832 })),
    };
    const steps = await readGalaxyDailySteps("2026-10-17", granted);
    expect(steps.steps).toBe(9832);
    expect(granted.requestPermissions).toHaveBeenCalledWith({ dataTypes:["steps"] });
    const denied = { ...granted, requestPermissions:async () => ({ stepsGranted:false }) };
    await expect(readGalaxyDailySteps("2026-10-17", denied)).rejects.toThrow(/permission/);
  });
  it("does not expose a web connection without an actual native Capacitor bridge", () => {
    expect(getHealthConnectBridge()).toBeNull();
  });
});

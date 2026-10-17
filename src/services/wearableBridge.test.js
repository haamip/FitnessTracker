import { describe, expect, it, vi } from "vitest";
import { getWearableBridge, readWearableSteps } from "./wearableBridge";

describe("generic wearable provider contract", () => {
  it("does not claim watch integration in the browser", () => {
    expect(getWearableBridge()).toBeNull();
  });
  it("reads Android Health Connect data through the existing native contract", async () => {
    const bridge = {
      getStatus: vi.fn(async () => ({ available: true, stepsGranted: true })),
      requestPermissions: vi.fn(),
      readTodaySteps: vi.fn(async () => ({ date: "2026-10-17", steps: 9200 })),
    };
    const daily = await readWearableSteps("2026-10-17", { platform: "android", bridge });
    expect(daily).toMatchObject({ steps: 9200, stepsSource: "health_connect" });
    expect(bridge.requestPermissions).not.toHaveBeenCalled();
  });
  it("requires explicit Apple Health permission and returns a device-neutral daily total", async () => {
    const bridge = {
      getStatus: vi.fn(async () => ({ available: true, stepsGranted: false })),
      requestPermissions: vi.fn(async () => ({ stepsGranted: true })),
      readTodaySteps: vi.fn(async () => ({ date: "2026-10-17", steps: 9700 })),
    };
    const result = await readWearableSteps("2026-10-17", { platform: "ios", bridge });
    expect(bridge.requestPermissions).toHaveBeenCalledWith({ dataTypes: ["steps"] });
    expect(result).toMatchObject({ steps: 9700, stepsSource: "apple_health" });
  });
  it("rejects unavailable or invalid providers and watch readings", async () => {
    await expect(readWearableSteps("2026-10-17", null)).rejects.toThrow(/native TrackFit/);
    await expect(readWearableSteps("2026-10-17", { platform: "unknown" })).rejects.toThrow(/Unsupported/);
    const bridge = { getStatus: async () => ({ available:true,stepsGranted:true }), readTodaySteps:async () => ({date:"2026-10-16",steps:5000}) };
    await expect(readWearableSteps("2026-10-17", { platform:"ios",bridge })).rejects.toThrow(/invalid/);
  });
});

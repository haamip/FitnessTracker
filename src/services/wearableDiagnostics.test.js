import { describe, expect, it, vi } from "vitest";
import { formatStepSourceComparison, inspectStepSources } from "./wearableDiagnostics";

describe("Health Connect source comparison", () => {
  const sample = {
    date: "2026-10-19", zone: "Australia/Perth",
    through: "2026-10-18T19:45:00Z", aggregatedSteps: 15,
    sources: [{ source: "com.sec.android.app.shealth", records: 3, rawSteps: 53 },
              { source: "android", records: 2, rawSteps: 15 }],
  };
  it("keeps the official priority-deduplicated total separate from raw sources", () => {
    const info = formatStepSourceComparison(sample, sample.date);
    expect(info.total).toBe(15);
    expect(info.sources.map(s => [s.label, s.rawSteps])).toEqual([["Samsung Health", 53], ["Your phone", 15]]);
  });
  it("does not show records for another day or malformed data", () => {
    expect(() => formatStepSourceComparison(sample, "2026-10-18")).toThrow();
    expect(() => formatStepSourceComparison({...sample, aggregatedSteps:-3}, sample.date)).toThrow();
  });
  it("requests only a user-initiated source comparison, not permissions or backup", async () => {
    const bridge = { diagnoseTodaySteps: vi.fn(async () => sample) };
    const result = await inspectStepSources(sample.date, { platform:"android", bridge });
    expect(bridge.diagnoseTodaySteps).toHaveBeenCalledWith({date:sample.date});
    expect(result.total).toBe(15);
  });
  it("is unavailable on the ordinary website or older Android APK", async () => {
    await expect(inspectStepSources("2026-10-19",null)).rejects.toThrow(/TrackFit Native/);
  });
});

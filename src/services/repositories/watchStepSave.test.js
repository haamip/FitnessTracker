import { describe, expect, it } from "vitest";
import { mergeImportedSteps } from "./watchStepSave";

describe("watch import persistence", () => {
  const day = "2026-10-18";
  const record = { steps: 32, stepsSource: "health_connect", stepsSyncedAt: "2026-10-18T11:00:00Z" };
  it("keeps existing mood, workout and nutrition details while replacing only steps", () => {
    const existing = { id:"old-id", date:day, mood:"Good", activityType:"workout", weightKg:101, steps:17, stepsSource:"manual" };
    expect(mergeImportedSteps(existing,day,record)).toMatchObject({
      ...existing, steps:32, stepsSource:"health_connect", stepsSyncedAt:"2026-10-18T11:00:00Z",
    });
  });
  it("creates a dated steps-only check-in when there wasn't one", () => {
    const saved = mergeImportedSteps(null,day,record);
    expect(saved).toMatchObject({ date:day, steps:32, stepsSource:"health_connect" });
    expect(saved.activityType).toBeUndefined();
  });
  it("never replaces a previously saved count with no-record or invalid data", () => {
    for (const invalid of [0, -1, 150001, 5.4]) {
      expect(() => mergeImportedSteps({date:day,steps:33},day,{...record,steps:invalid})).toThrow();
    }
  });
  it("refuses unapproved sources and a different local calendar day", () => {
    expect(() => mergeImportedSteps(null,day,{...record,stepsSource:"manual"})).toThrow();
    expect(() => mergeImportedSteps({date:"2026-10-17"},day,record)).toThrow();
  });
});

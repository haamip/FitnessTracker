import { describe, expect, it } from "vitest";
import { compareStepTotals } from "./stepComparison";

describe("saved versus live Health Connect steps", () => {
  it("reports a newer Health Connect total without claiming watch-only steps", () => {
    expect(compareStepTotals(7721, 9000)).toEqual({ kind: "more-now", difference: 1279 });
  });
  it("handles same and lower totals without summing sources", () => {
    expect(compareStepTotals(7721, 7721)).toEqual({ kind: "match", difference: 0 });
    expect(compareStepTotals(9000, 7721)).toEqual({ kind: "less-now", difference: -1279 });
  });
  it("distinguishes a missing saved record from a valid zero", () => {
    expect(compareStepTotals(null, 50)).toEqual({ kind: "no-saved", difference: null });
    expect(compareStepTotals("", 50)).toEqual({ kind: "no-saved", difference: null });
    expect(compareStepTotals(0, 50)).toEqual({ kind: "more-now", difference: 50 });
  });
  it("rejects malformed aggregate counts", () => {
    expect(compareStepTotals(500, -3)).toEqual({ kind: "invalid", difference: null });
    expect(compareStepTotals(500, 20.3)).toEqual({ kind: "invalid", difference: null });
  });
});

import { describe, it, expect } from "vitest";
import { normaliseStepSourceMode, stepSourceName } from "./stepSourcePreference";

describe("step source selection", () => {
  it("defaults to combined and accepts Samsung Health only", () => {
    expect(normaliseStepSourceMode(null)).toBe("all");
    expect(normaliseStepSourceMode("unknown")).toBe("all");
    expect(normaliseStepSourceMode("samsung_health")).toBe("samsung_health");
  });
  it("labels Samsung Health without falsely promising watch-only steps", () => {
    expect(stepSourceName("samsung_health")).toBe("Samsung Health");
    expect(stepSourceName("all")).toBe("Health Connect combined");
  });
});

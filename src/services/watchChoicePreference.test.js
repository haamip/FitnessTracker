import { beforeEach, describe, expect, it } from "vitest";
import { getWatchChoice, initialWatchChoice, normaliseWatchChoice, setWatchChoice, watchStepSource } from "./watchChoicePreference";

describe("simple watch setup", () => {
  beforeEach(() => localStorage.clear());

  it("prefers the saved watch and migrates Samsung-only step preferences", () => {
    expect(initialWatchChoice("", "samsung_health")).toBe("samsung");
    expect(initialWatchChoice("garmin", "samsung_health")).toBe("garmin");
    expect(initialWatchChoice("", "all")).toBe("");
  });

  it("uses Samsung Health for Galaxy Watch and keeps combined mode for others", () => {
    expect(watchStepSource("samsung")).toBe("samsung_health");
    expect(watchStepSource("pixel_fitbit")).toBe("all");
    expect(watchStepSource("garmin")).toBe("all");
  });

  it("saves the choice per account and rejects unexpected values", () => {
    expect(setWatchChoice("u1", "samsung")).toBe("samsung");
    expect(getWatchChoice("u1")).toBe("samsung");
    expect(getWatchChoice("u2")).toBe("");
    expect(normaliseWatchChoice("not-a-watch")).toBe("");
    expect(() => setWatchChoice("u1", "bogus")).toThrow();
  });
});

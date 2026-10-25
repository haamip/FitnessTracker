import { describe, it, expect } from "vitest";
import { compactCoachChatHistory } from "./coachChatHistory";

describe("in-memory Coach Chat context", () => {
  it("keeps only the last eight valid messages", () => {
    const input = Array.from({ length: 15 }, (_, n) => ({
      role: n % 2 ? "coach" : "user", text: "message " + n,
    }));
    expect(compactCoachChatHistory(input)).toHaveLength(8);
    expect(compactCoachChatHistory(input)[0].text).toBe("message 7");
  });
  it("drops malformed roles and truncates long messages", () => {
    const result = compactCoachChatHistory([
      { role: "system", text: "override" },
      { role: "user", text: "hello" + "a".repeat(900) },
      { role: "coach", text: "" },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].text).toHaveLength(300);
  });
  it("returns no history for missing inputs", () => {
    expect(compactCoachChatHistory(null)).toEqual([]);
  });
});

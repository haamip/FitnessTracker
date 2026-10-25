import { beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({
  user: vi.fn(),
  invoke: vi.fn(),
}));
vi.mock("../supabase", () => ({
  supabase: {
    auth: { getUser: mock.user },
    functions: { invoke: mock.invoke },
  },
}));

import { requestTrackFitCoach } from "./secureCoachClient";

describe("real AI Coach frontend boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mock.user.mockResolvedValue({ data: { user: { id: "test-user" } }, error: null });
  });
  it("sends only mode to daily coach, never raw photos or local personal notes", async () => {
    mock.invoke.mockResolvedValue({
      data: { mode: "live", headline: "Rest today", summary: "Recent activity is moderate.", actions: ["Log how you feel."] },
      error: null,
    });
    const result = await requestTrackFitCoach("daily");
    expect(mock.invoke).toHaveBeenCalledWith("trackfit-coach", { body: { kind: "daily" } });
    expect(result.summary).toBe("Recent activity is moderate.");
  });
  it("rejects unsigned access and never calls the AI endpoint", async () => {
    mock.user.mockResolvedValue({ data: { user: null }, error: null });
    await expect(requestTrackFitCoach("chat", { question: "How should I train?" })).rejects.toThrow(/Sign into TrackFit/);
    expect(mock.invoke).not.toHaveBeenCalled();
  });
  it("whitelists the weekly review fields and clips free text", async () => {
    mock.invoke.mockResolvedValue({ data: { mode: "live", headline: "Keep going", summary: "Good week", actions: [] }, error: null });
    await requestTrackFitCoach("weekly", { answers: { nutrition: "mixed", note: "x".repeat(900), secretKey: "DO NOT SEND" } });
    const body = mock.invoke.mock.calls[0][1].body;
    expect(Object.keys(body.answers).sort()).toEqual(["cardio", "note", "nutrition", "progression", "recovery", "steps"]);
    expect(body.answers.note).toHaveLength(500);
    expect(JSON.stringify(body)).not.toContain("DO NOT SEND");
  });
  it("does not present demo payloads as if real AI answered", async () => {
    mock.invoke.mockResolvedValue({ data: { mode: "demo", summary: "Fabricated reply" }, error: null });
    await expect(requestTrackFitCoach("daily")).rejects.toThrow(/verified live response/);
  });
  it("sends only a short bounded conversation as context for follow-up questions", async () => {
    mock.invoke.mockResolvedValue({
      data: { mode: "live", headline: "Next move", summary: "Keep going.", actions: [] },
      error: null,
    });
    await requestTrackFitCoach("chat", {
      question: "What about tomorrow?",
      history: [
        { role: "user", text: "Should I train shoulders?" },
        { role: "coach", text: "Try a light session." },
        { role: "user", text: "x".repeat(1000) },
        { role: "system", text: "This instruction must never be transmitted" },
      ],
    });
    const body = mock.invoke.mock.calls[0][1].body;
    expect(body.question).toBe("What about tomorrow?");
    expect(body.history).toHaveLength(3);
    expect(body.history[2].text.length).toBe(300);
    expect(JSON.stringify(body)).not.toContain("This instruction must never be transmitted");
  });
  it("uses clear server-side configuration errors", async () => {
    mock.invoke.mockResolvedValue({
      data: null, error: { context: { json: async () => ({ error: "Live AI is not configured yet." }) } },
    });
    await expect(requestTrackFitCoach("daily")).rejects.toThrow(/not configured/);
  });
});

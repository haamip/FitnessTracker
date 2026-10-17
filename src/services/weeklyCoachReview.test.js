import { describe, expect, it } from "vitest";
import { buildWeeklyFeedback, getWeekStart, getWeeklyFacts } from "./weeklyCoachReview";

describe("weekly coaching from genuine logs", () => {
  const now = new Date(2026, 9, 17, 12);
  it("uses a Monday date key for the review period", () => {
    expect(getWeekStart(now)).toBe("2026-10-12");
  });

  it("calculates steps once per day, not added again from cardio", () => {
    const facts = getWeeklyFacts({
      checkIns: [
        { date:"2026-10-12", steps: 10000, mood:"Good" },
        { date:"2026-10-13", steps: 6000, mood:"Flat" },
        { date:"2026-10-14", mood:"Okay" },
      ],
      workouts: [
        { completedAt: "2026-10-13T10:00:00", volume: 2400, prs:[{exercise:"Press"}] },
        { completedAt: "2026-10-04T10:00:00", volume: 9999 },
      ],
      cardio: [{ date: "2026-10-12", steps: 2500, durationMin: 30 }],
      meals: [{ date: "2026-10-12", protein: 120 }],
    }, "2026-10-12", now);
    expect(facts).toMatchObject({
      workouts:1, strengthVolumeKg:2400, prs:1, cardioMinutes:30,
      loggedStepDays:2, averageSteps:8000, steps:16000, lowMoodDays:1,
      checkInDays:3, nutritionLoggedDays:1,
    });
  });

  it("identifies improved comparable working sets versus prior week", () => {
    const facts = getWeeklyFacts({
      workouts: [
        { completedAt: "2026-10-07T08:00:00Z", exercises: [{ name:"Bench Press", sets:[{ done:true, weight:80, reps:5 }] }] },
        { completedAt: "2026-10-14T08:00:00Z", exercises: [{ name:"Bench Press", sets:[{ done:true, weight:85, reps:5 }] }] },
      ],
    }, "2026-10-12", now);
    expect(facts.improvedExercises).toEqual(["Bench Press"]);
    const feedback = buildWeeklyFeedback(facts, {progression:"improved"});
    expect(feedback.evidence.join(" ")).toContain("Bench Press");
  });

  it("does not invent missing step averages or declare a failed week", () => {
    const facts = getWeeklyFacts({checkIns:[{date:"2026-10-12", mood:"Okay"}]}, "2026-10-12", now);
    expect(facts.averageSteps).toBe(null);
    const feedback = buildWeeklyFeedback(facts, { nutrition:"on-track",cardio:"less" });
    expect(feedback.evidence.join(" ")).toContain("Not enough daily step entries");
    expect(feedback.evidence.join(" ")).toContain("meal logs are unavailable");
    expect(feedback.nextSteps).toContain("Plan one easy cardio session.");
  });
});

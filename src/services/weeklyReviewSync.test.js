import { describe, it, expect } from "vitest";
import {
  weeklyReviewCacheKey, pendingWeeklyReviewsKey, validReviewWeek,
  mergeWeeklyReviews, fromCloudWeeklyReview,
} from "./weeklyReviewSync";

const alice = "11111111-1111-4111-8111-111111111111";
const bob = "22222222-2222-4222-8222-222222222222";

describe("weekly review cloud reconciliation", () => {
  it("isolates data by account", () => {
    expect(weeklyReviewCacheKey(alice)).not.toEqual(weeklyReviewCacheKey(bob));
    expect(pendingWeeklyReviewsKey(alice)).toContain(alice);
    expect(() => weeklyReviewCacheKey("")).toThrow(/Sign in/);
  });
  it("requires a real Monday week key", () => {
    expect(validReviewWeek("2026-10-26")).toBe(true);
    expect(validReviewWeek("2026-10-27")).toBe(false);
    expect(validReviewWeek("2026-02-30")).toBe(false);
  });
  it("preserves unsynced notes and lets cloud win once backed up", () => {
    const remote = [{ weekStart: "2026-10-26", answers: { note: "Server" } }];
    const local = [{ weekStart: "2026-10-26", answers: { note: "New edit" } }];
    expect(mergeWeeklyReviews(remote, local, ["2026-10-26"])).toEqual(local);
    expect(mergeWeeklyReviews(remote, local, [])).toEqual(remote);
    expect(mergeWeeklyReviews(remote, [{ weekStart: "2026-10-19", answers: {} }]))
      .toHaveLength(2);
  });
  it("maps Supabase rows without uploading progress photos", () => {
    expect(fromCloudWeeklyReview({ week_start: "2026-10-26", answers: { note: "Good week" },
      updated_at: "2026-10-28T00:00:00Z" })).toMatchObject({
        weekStart: "2026-10-26", answers: { note: "Good week" },
      });
  });
});

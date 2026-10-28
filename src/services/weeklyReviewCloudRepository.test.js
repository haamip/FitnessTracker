import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("./supabase", () => ({ supabase: null }));
import { WeeklyReviewRepository } from "./weeklyCoachReview";
import { WeeklyReviewCloudRepository } from "./weeklyReviewCloudRepository";

const alice = "11111111-1111-4111-8111-111111111111";
const bob = "22222222-2222-4222-8222-222222222222";
const week = "2026-10-26";
const record = { weekStart: week, answers: {
  nutrition:"mixed", steps:"great", cardio:"good",
  progression:"improved", recovery:"okay", note:"Progress",
} };

describe("weekly review offline repository", () => {
  beforeEach(() => { localStorage.clear(); WeeklyReviewRepository.setActiveUser(alice); });
  afterEach(() => WeeklyReviewRepository.setActiveUser(null));

  it("stores an offline review, queues it and retains it after account switching", async () => {
    const result = await WeeklyReviewCloudRepository.save(record);
    expect(result.cloudSaved).toBe(false);
    expect(WeeklyReviewRepository.getByWeek(week).answers.note).toBe("Progress");
    expect(WeeklyReviewRepository.getPendingWeeks()).toEqual([week]);

    WeeklyReviewRepository.setActiveUser(bob);
    expect(WeeklyReviewRepository.getByWeek(week)).toBeNull();
    expect(WeeklyReviewCloudRepository.getPendingCount()).toBe(0);

    WeeklyReviewRepository.setActiveUser(alice);
    expect(WeeklyReviewRepository.getByWeek(week).answers.note).toBe("Progress");
    expect(WeeklyReviewCloudRepository.getPendingCount()).toBe(1);
  });

  it("marks later edits as pending and ignores acknowledgement of older revisions", async () => {
    const first = (await WeeklyReviewCloudRepository.save(record)).review;
    const second = (await WeeklyReviewCloudRepository.save({
      ...record, answers: { ...record.answers, note: "Improved further" },
    })).review;
    expect(WeeklyReviewRepository.getAll()).toHaveLength(1);
    expect(WeeklyReviewRepository.acknowledge(week, first.syncRevision)).toBe(false);
    expect(WeeklyReviewRepository.getPendingWeeks()).toEqual([week]);
    expect(WeeklyReviewRepository.acknowledge(week, second.syncRevision)).toBe(true);
    expect(WeeklyReviewRepository.getPendingWeeks()).toEqual([]);
  });

  it("restores unowned browser records only after explicit confirmation", () => {
    localStorage.setItem("trackfit_weekly_reviews_v1", JSON.stringify([record]));
    expect(WeeklyReviewRepository.getAll()).toEqual([]);
    expect(WeeklyReviewRepository.getLegacyCount()).toBe(1);
    expect(WeeklyReviewRepository.importLegacyForCurrentUser()).toBe(1);
    expect(WeeklyReviewRepository.getPendingWeeks()).toEqual([week]);
    WeeklyReviewRepository.setActiveUser(bob);
    expect(WeeklyReviewRepository.getAll()).toEqual([]);
    expect(WeeklyReviewRepository.getLegacyCount()).toBe(0);
    expect(JSON.parse(localStorage.getItem("trackfit_weekly_reviews_v1"))).toEqual([record]);
  });
});

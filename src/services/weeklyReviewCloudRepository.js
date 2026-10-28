import { supabase } from "./supabase";
import { WeeklyReviewRepository } from "./weeklyCoachReview";
import { fromCloudWeeklyReview, mergeWeeklyReviews } from "./weeklyReviewSync";

const uploading = new Map();
const isActive = id => Boolean(id) && WeeklyReviewRepository.getActiveUser() === id;

async function currentUserId() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id || null;
}

async function uploadReview(review) {
  const userId = WeeklyReviewRepository.getActiveUser();
  if (!supabase || !userId || !review?.weekStart) return false;
  const key = `${userId}:${review.weekStart}`;
  if (uploading.has(key)) return uploading.get(key);

  const work = (async () => {
    if (!isActive(userId) || await currentUserId() !== userId) return false;
    const { error } = await supabase.from("weekly_reviews").upsert({
      user_id: userId, week_start: review.weekStart,
      answers: review.answers || {}, updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,week_start" });
    if (error) throw error;
    if (!isActive(userId)) return false;
    // A second edit may have occurred during the request. Its pending
    // revision must not be incorrectly marked as backed up.
    return WeeklyReviewRepository.acknowledge(review.weekStart, review.syncRevision);
  })();
  uploading.set(key, work);
  try { return await work; }
  finally { if (uploading.get(key) === work) uploading.delete(key); }
}

export const WeeklyReviewCloudRepository = {
  getCached() { return WeeklyReviewRepository.getAll(); },
  getPendingCount() { return WeeklyReviewRepository.getPendingWeeks().length; },

  async load() {
    const userId = WeeklyReviewRepository.getActiveUser();
    if (!userId || !supabase) return { reviews: this.getCached(), offline: true };
    try {
      if (await currentUserId() !== userId || !isActive(userId))
        return { reviews: this.getCached(), offline: true };
      const { data, error } = await supabase.from("weekly_reviews")
        .select("week_start,answers,updated_at")
        .eq("user_id", userId).order("week_start", { ascending: false });
      if (error) throw error;
      if (!isActive(userId)) return { reviews: [], offline: true };
      const merged = mergeWeeklyReviews(
        (data || []).map(fromCloudWeeklyReview),
        WeeklyReviewRepository.getAll(), WeeklyReviewRepository.getPendingWeeks(),
      );
      WeeklyReviewRepository.saveAll(merged);
      if (this.getPendingCount()) {
        Promise.resolve().then(() => this.retryPending())
          .catch(error => console.warn("Weekly review backup deferred.", error));
      }
      return { reviews: merged, offline: false };
    } catch (error) {
      console.warn("Weekly reviews cloud load failed; retaining account cache.", error);
      return { reviews: this.getCached(), offline: true };
    }
  },

  async save(review) {
    const saved = WeeklyReviewRepository.save(review);
    try {
      const cloudSaved = await uploadReview(saved);
      return { review: saved, cloudSaved };
    } catch (error) {
      console.warn("Weekly review saved locally; backup pending.", error);
      return { review: saved, cloudSaved: false };
    }
  },

  async retryPending() {
    const userId = WeeklyReviewRepository.getActiveUser();
    if (!userId || !supabase) return this.getPendingCount();
    const pendingWeeks = new Set(WeeklyReviewRepository.getPendingWeeks());
    for (const review of WeeklyReviewRepository.getAll().filter(row => pendingWeeks.has(row.weekStart))) {
      if (!isActive(userId)) break;
      try { await uploadReview(review); }
      catch (error) { console.warn("Weekly review upload will retry.", error); }
    }
    return this.getPendingCount();
  },
};

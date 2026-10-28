import { readJson, writeJson } from "./utils/storage";
import { weeklyReviewCacheKey, pendingWeeklyReviewsKey, validReviewWeek } from "./weeklyReviewSync";

function number(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
function dateKey(value) { return typeof value === "string" ? value.slice(0, 10) : ""; }
function monday(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function getWeekStart(now = new Date()) { return monday(now); }

function dateWithin(date, start, end) {
  const key = dateKey(date);
  return Boolean(key && key >= start && key <= end);
}

function bestWorkingSets(workouts) {
  const best = new Map();
  for (const session of workouts) {
    for (const exercise of session.exercises || []) {
      const scores = (exercise.sets || [])
        .filter((set) => set.done)
        .map((set) => {
          const weight = Number(set.weight);
          const reps = Number(set.reps);
          return Number.isFinite(weight) && Number.isFinite(reps) && weight > 0 && reps >= 1 && reps <= 30
            ? weight * (1 + reps / 30)
            : 0;
        });
      const score = Math.max(0, ...scores);
      const key = String(exercise.name || "").trim().toLowerCase();
      if (key && score > (best.get(key)?.score || 0)) best.set(key, { name: exercise.name, score });
    }
  }
  return best;
}

export function getWeeklyFacts({ checkIns = [], workouts = [], cardio = [], meals = [] }, start, today = new Date()) {
  const endDate = new Date(start + "T12:00:00");
  endDate.setDate(endDate.getDate() + 6);
  const end = dateKey(`${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2,"0")}-${String(endDate.getDate()).padStart(2,"0")}`);
  const localToday = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  const through = end < localToday ? end : localToday;
  const days = checkIns.filter((x) => dateWithin(x.date, start, through));
  const lowMoodDays = days.filter((x) => ["Flat", "Rough"].includes(x.mood)).length;
  const lifts = workouts.filter((x) => dateWithin(x.completedAt, start, through));
  const previousWeek = new Date(start + "T12:00:00");
  previousWeek.setDate(previousWeek.getDate() - 7);
  const previousStart = getWeekStart(previousWeek);
  const prior = workouts.filter((x) => dateWithin(x.completedAt, previousStart, start) && dateKey(x.completedAt) !== start);
  const currentBest = bestWorkingSets(lifts);
  const previousBest = bestWorkingSets(prior);
  const improvedExercises = [...currentBest.entries()]
    .filter(([name, value]) => previousBest.has(name) && value.score > previousBest.get(name).score * 1.01)
    .map(([, value]) => value.name)
    .slice(0, 3);
  const movement = cardio.filter((x) => dateWithin(x.date, start, through));
  const food = meals.filter((x) => dateWithin(x.date, start, through));
  const stepDays = days.filter((x) => x.steps !== null && x.steps !== "" && Number.isFinite(Number(x.steps)) && Number(x.steps) >= 0);
  const steps = stepDays.reduce((sum, x) => sum + number(x.steps), 0);
  const minutes = movement.reduce((sum, x) => sum + number(x.durationMin ?? x.minutes ?? x.duration), 0);
  const volume = lifts.reduce((sum, x) => sum + number(x.volume ?? x.totalVolume), 0);
  const prs = lifts.reduce((sum, x) => sum + (Array.isArray(x.prs) ? x.prs.length : 0), 0);
  const weightDays = days.filter((x) => number(x.weightKg ?? x.weight) > 0).sort((a,b) => a.date.localeCompare(b.date));
  const weightChangeKg = weightDays.length >= 2
    ? Math.round((number(weightDays.at(-1).weightKg ?? weightDays.at(-1).weight) - number(weightDays[0].weightKg ?? weightDays[0].weight)) * 10) / 10
    : null;
  return {
    start, end, through,
    checkInDays: days.length,
    lowMoodDays,
    workouts: lifts.length,
    strengthVolumeKg: Math.round(volume),
    prs,
    improvedExercises,
    cardioSessions: movement.length,
    cardioMinutes: Math.round(minutes),
    loggedStepDays: stepDays.length,
    steps: Math.round(steps),
    averageSteps: stepDays.length ? Math.round(steps / stepDays.length) : null,
    nutritionLoggedDays: new Set(food.map((x)=>dateKey(x.date))).size,
    weightChangeKg,
  };
}

/** This is rules-based feedback grounded in recorded facts, not a generative AI response. */
export function buildWeeklyFeedback(facts, answers = {}) {
  const evidence = [];
  const nextSteps = [];
  if (facts.workouts > 0) {
    evidence.push(`${facts.workouts} completed strength session${facts.workouts === 1 ? "" : "s"} (${facts.strengthVolumeKg.toLocaleString()}kg logged volume).`);
  } else {
    evidence.push("No completed strength sessions recorded this week.");
    nextSteps.push("Start with one manageable strength session.");
  }
  if (facts.improvedExercises?.length) {
    evidence.push(`Estimated strength improved versus last week for: ${facts.improvedExercises.join(", ")}.`);
  }
  if (facts.prs > 0) evidence.push(`${facts.prs} personal-record signal${facts.prs === 1 ? "" : "s"} recorded.`);
  if (facts.loggedStepDays > 0) {
    evidence.push(`Average of ${facts.averageSteps.toLocaleString()} steps across ${facts.loggedStepDays} logged day${facts.loggedStepDays === 1 ? "" : "s"}.`);
    if (facts.averageSteps < 7000 && answers.steps !== "great") nextSteps.push("Try a short daily walk if recovery allows.");
  } else {
    evidence.push("Not enough daily step entries to calculate a step average.");
    nextSteps.push("Add steps during your quick daily check-in.");
  }
  if (facts.lowMoodDays > 0) {
    evidence.push(`${facts.lowMoodDays} daily check-in${facts.lowMoodDays === 1 ? "" : "s"} reported feeling flat or rough.`);
    if (answers.recovery !== "good") nextSteps.push("Keep recovery manageable; consider an easier day when needed.");
  }
  if (answers.nutrition === "on-track") {
    evidence.push(facts.nutritionLoggedDays > 0
      ? `You reported nutrition on track; food was logged on ${facts.nutritionLoggedDays} day(s).`
      : "You reported nutrition on track; meal logs are unavailable to verify it.");
  }
  if (facts.cardioSessions > 0) evidence.push(`${facts.cardioMinutes} minutes of logged cardio across ${facts.cardioSessions} sessions.`);
  else if (answers.cardio === "less") nextSteps.push("Plan one easy cardio session.");
  if (answers.nutrition === "struggled") nextSteps.push("Make one realistic food habit the focus next week.");
  if (answers.progression === "stalled") {
    nextSteps.push("Review your main lifts and recovery before increasing the load.");
  } else if (answers.progression === "improved" && facts.workouts === 0) {
    evidence.push("You reported training progress, but no completed workouts were logged to compare.");
  }
  if (answers.recovery === "rough") nextSteps.unshift("Prioritise rest and reduce intensity until you're feeling better.");
  if (facts.weightChangeKg !== null) evidence.push(`Weight change across logged check-ins: ${facts.weightChangeKg > 0 ? "+" : ""}${facts.weightChangeKg}kg.`);
  if (!nextSteps.length) nextSteps.push("Keep logging your main lifts and maintain your routine.");
  const heading = facts.workouts > 0 || facts.cardioSessions > 0
    ? "You've got useful training data to build on."
    : "Let's get a few consistent entries next week.";
  return { heading, evidence, nextSteps: nextSteps.slice(0, 3),
    note: "This review uses your recorded workouts, activity and your answers. Missing data is not treated as a failed week." };
}

const LEGACY_REVIEW_KEY = "trackfit_weekly_reviews_v1";
const LEGACY_REVIEW_CLAIM_KEY = "trackfit_weekly_reviews_legacy_claimed";
let activeWeeklyAccountId = null;

export const WeeklyReviewRepository = {
  setActiveUser(userId) {
    activeWeeklyAccountId = typeof userId === "string" && userId ? userId : null;
  },
  getActiveUser() { return activeWeeklyAccountId; },
  getAll() {
    return activeWeeklyAccountId
      ? readJson(weeklyReviewCacheKey(activeWeeklyAccountId), []) : [];
  },
  getByWeek(weekStart) {
    return this.getAll().find(record => record.weekStart === weekStart) || null;
  },
  saveAll(reviews) {
    if (!activeWeeklyAccountId) throw new Error("Sign in to save weekly reviews.");
    writeJson(weeklyReviewCacheKey(activeWeeklyAccountId), reviews
      .filter(x => validReviewWeek(x?.weekStart))
      .sort((a,b) => b.weekStart.localeCompare(a.weekStart)));
  },
  getPendingWeeks() {
    return activeWeeklyAccountId
      ? readJson(pendingWeeklyReviewsKey(activeWeeklyAccountId), []) : [];
  },
  markPending(weekStart) {
    if (!activeWeeklyAccountId || !validReviewWeek(weekStart)) return;
    const key = pendingWeeklyReviewsKey(activeWeeklyAccountId);
    writeJson(key, [...new Set([...readJson(key, []), weekStart])]);
  },
  acknowledge(weekStart, syncRevision) {
    if (!activeWeeklyAccountId) return false;
    const record = this.getByWeek(weekStart);
    if (!record || record.syncRevision !== syncRevision) return false;
    const key = pendingWeeklyReviewsKey(activeWeeklyAccountId);
    writeJson(key, readJson(key, []).filter(x => x !== weekStart));
    return true;
  },
  save(review) {
    if (!activeWeeklyAccountId || !validReviewWeek(review?.weekStart))
      throw new Error("Sign in and choose a valid review week.");
    const result = {
      ...review, savedAt: new Date().toISOString(), syncRevision: crypto.randomUUID(),
    };
    this.saveAll([result, ...this.getAll().filter(x => x.weekStart !== review.weekStart)]);
    this.markPending(review.weekStart);
    return result;
  },
  getLegacyCount() {
    if (!activeWeeklyAccountId || localStorage.getItem(LEGACY_REVIEW_CLAIM_KEY)) return 0;
    return readJson(LEGACY_REVIEW_KEY, []).length;
  },
  importLegacyForCurrentUser() {
    if (!activeWeeklyAccountId || localStorage.getItem(LEGACY_REVIEW_CLAIM_KEY)) return 0;
    const current = this.getAll();
    const occupied = new Set(current.map(x => x.weekStart));
    const imported = readJson(LEGACY_REVIEW_KEY, [])
      .filter(x => validReviewWeek(x?.weekStart) && !occupied.has(x.weekStart))
      .map(x => ({ ...x, syncRevision: crypto.randomUUID() }));
    this.saveAll([...current, ...imported]);
    for (const row of imported) this.markPending(row.weekStart);
    // Old browser-wide data has no owner. Require explicit user confirmation
    // and retain the old backup instead of silently assigning it on login.
    localStorage.setItem(LEGACY_REVIEW_CLAIM_KEY, activeWeeklyAccountId);
    return imported.length;
  },
};

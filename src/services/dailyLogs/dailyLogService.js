import { readJson, writeJson } from "../utils/storage";
import { CardioRepository, HistoryRepository, NutritionRepository } from "../repositories/trackfitDataLayer";
import { getOperationalDate, getShiftMode } from "../shift/shiftModeService";

const DAILY_LOGS_KEY = "trackfit_daily_logs";
const SECTIONS = ["nutrition", "training", "cardio"];

const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const dateOnly = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value).slice(0, 10) : parsed.toLocaleDateString("en-CA");
};

function readLogs() {
  return readJson(DAILY_LOGS_KEY, {});
}

function writeLogs(logs) {
  writeJson(DAILY_LOGS_KEY, logs);
  return logs;
}

function sectionSummary(date, section) {
  if (section === "nutrition") {
    const meals = NutritionRepository.getAll().filter((item) => item.date === date);
    return {
      count: meals.length,
      calories: meals.reduce((sum, item) => sum + number(item.calories), 0),
      proteinG: meals.reduce((sum, item) => sum + number(item.protein), 0),
    };
  }

  if (section === "cardio") {
    const sessions = CardioRepository.getAll().filter((item) => dateOnly(item.date || item.completedAt || item.createdAt) === date);
    return {
      count: sessions.length,
      minutes: sessions.reduce((sum, item) => sum + number(item.durationMin ?? item.durationMinutes ?? item.duration), 0),
      distanceKm: sessions.reduce((sum, item) => sum + number(item.distanceKm ?? item.distance), 0),
    };
  }

  const workouts = HistoryRepository.getAll().filter((item) => dateOnly(item.completedAt || item.date) === date);
  return {
    count: workouts.length,
    completedSets: workouts.reduce((sum, item) => sum + number(item.completedSets ?? item.doneSets), 0),
    volume: workouts.reduce((sum, item) => sum + number(item.volume ?? item.totalVolume), 0),
  };
}

export function completeSection(section, options = {}) {
  if (!SECTIONS.includes(section)) throw new Error(`Unknown daily log section: ${section}`);
  const mode = options.mode || getShiftMode();
  const date = options.date || getOperationalDate(new Date(), mode);
  const logs = readLogs();
  const current = logs[date] || { date, shiftMode: mode, sections: {} };
  current.sections[section] = {
    status: "complete",
    completedAt: new Date().toISOString(),
    automatic: Boolean(options.automatic),
    summary: sectionSummary(date, section),
  };
  current.completed = SECTIONS.every((name) => current.sections[name]?.status === "complete");
  current.updatedAt = new Date().toISOString();
  logs[date] = current;
  writeLogs(logs);
  return current;
}

export function completeDay(options = {}) {
  let record;
  SECTIONS.forEach((section) => {
    record = completeSection(section, options);
  });
  return record;
}

export function getDailyLogs() {
  autoCompletePreviousDays();
  const logs = readLogs();
  const dates = new Set([
    ...Object.keys(logs),
    ...NutritionRepository.getAll().map((item) => item.date),
    ...CardioRepository.getAll().map((item) => dateOnly(item.date || item.completedAt || item.createdAt)),
    ...HistoryRepository.getAll().map((item) => dateOnly(item.completedAt || item.date)),
  ]);

  return [...dates]
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a))
    .map((date) => ({
      date,
      ...(logs[date] || { shiftMode: "day", sections: {}, completed: false }),
      summaries: {
        nutrition: sectionSummary(date, "nutrition"),
        training: sectionSummary(date, "training"),
        cardio: sectionSummary(date, "cardio"),
      },
    }));
}

export function getCurrentDayStatus(mode = getShiftMode()) {
  autoCompletePreviousDays();
  const date = getOperationalDate(new Date(), mode);
  const record = readLogs()[date] || { date, shiftMode: mode, sections: {}, completed: false };
  return { ...record, date };
}

export function autoCompletePreviousDays(now = new Date(), mode = getShiftMode()) {
  const currentDate = getOperationalDate(now, mode);
  const logs = readLogs();
  const dataDates = new Set([
    ...NutritionRepository.getAll().map((item) => item.date),
    ...CardioRepository.getAll().map((item) => dateOnly(item.date || item.completedAt || item.createdAt)),
    ...HistoryRepository.getAll().map((item) => dateOnly(item.completedAt || item.date)),
  ]);

  dataDates.forEach((date) => {
    if (!date || date >= currentDate) return;
    const record = logs[date];
    if (record?.completed) return;
    SECTIONS.forEach((section) => completeSection(section, { date, mode: record?.shiftMode || mode, automatic: true }));
  });
}

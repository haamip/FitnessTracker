// Calendar-day aggregates: unlike weekday names, YYYY-MM-DD keys don't merge weeks.
export function localDateKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function dateKey(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  return localDateKey(value);
}

export function lastSevenDays(today = new Date()) {
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(end);
    date.setDate(end.getDate() - (6 - index));
    return { key: localDateKey(date), label: new Intl.DateTimeFormat("en-AU", { weekday: "short", day: "numeric" }).format(date) };
  });
}

const positive = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export function buildSevenDayCardio(sessions = [], today = new Date()) {
  const days = lastSevenDays(today);
  const byDay = new Map(days.map((day) => [day.key, { date: day.label, distance: 0, minutes: 0, count: 0 }]));
  for (const session of sessions) {
    const row = byDay.get(dateKey(session.date));
    if (!row) continue;
    row.distance += positive(session.distanceKm ?? session.distance);
    row.minutes += positive(session.durationMin ?? session.duration);
    row.count += 1;
  }
  return [...byDay.values()].map((row) => ({
    ...row, distance: Math.round(row.distance * 10) / 10, minutes: Math.round(row.minutes),
  }));
}

export function recentCardioTotals(sessions = [], today = new Date()) {
  const keys = new Set(lastSevenDays(today).map((row) => row.key));
  return sessions.filter((s) => keys.has(dateKey(s.date))).reduce((summary, s) => ({
    distanceKm: summary.distanceKm + positive(s.distanceKm),
    durationMin: summary.durationMin + positive(s.durationMin),
    calories: summary.calories + positive(s.calories),
    sessionSteps: summary.sessionSteps + positive(s.steps),
    count: summary.count + 1,
  }), { distanceKm: 0, durationMin: 0, calories: 0, sessionSteps: 0, count: 0 });
}

export function pacePerKm(distanceKm, durationMin) {
  const distance = positive(distanceKm);
  const duration = positive(durationMin);
  if (!distance || !duration) return "Pace pending";
  const seconds = Math.round(duration * 60 / distance);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}/km`;
}

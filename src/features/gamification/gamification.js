const STORAGE_KEY = "trackfit_gamification_v1";

const defaultState = {
  xp: 420,
  level: 1,
  streak: 1,
  lastCheckInDate: null,
  unlocked: ["first-checkin"],
};

export const achievements = [
  {
    id: "first-checkin",
    title: "First Check-In",
    detail: "Logged your first daily check-in.",
    icon: "✅",
    xp: 25,
  },
  {
    id: "seven-day-streak",
    title: "7 Day Streak",
    detail: "Showed up for 7 days straight.",
    icon: "🔥",
    xp: 150,
  },
  {
    id: "night-shift-warrior",
    title: "Night Shift Warrior",
    detail: "Trained or checked in while grinding nights.",
    icon: "🌙",
    xp: 100,
  },
  {
    id: "protein-hitter",
    title: "Protein Hitter",
    detail: "Hit your protein target.",
    icon: "🥩",
    xp: 75,
  },
];

export function getGamificationState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...defaultState, ...JSON.parse(saved) } : defaultState;
  } catch {
    return defaultState;
  }
}

export function saveGamificationState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getXpForNextLevel(level) {
  return 500 + (level - 1) * 250;
}

export function addXp(amount, reason = "Progress logged") {
  const current = getGamificationState();
  let nextXp = current.xp + amount;
  let nextLevel = current.level;
  let xpTarget = getXpForNextLevel(nextLevel);

  while (nextXp >= xpTarget) {
    nextXp -= xpTarget;
    nextLevel += 1;
    xpTarget = getXpForNextLevel(nextLevel);
  }

  const next = {
    ...current,
    xp: nextXp,
    level: nextLevel,
    lastReason: reason,
  };

  saveGamificationState(next);
  return next;
}

export function unlockAchievement(id) {
  const current = getGamificationState();

  if (current.unlocked.includes(id)) {
    return current;
  }

  const achievement = achievements.find((item) => item.id === id);
  const withAchievement = {
    ...current,
    unlocked: [...current.unlocked, id],
    lastUnlocked: achievement,
  };

  saveGamificationState(withAchievement);

  return achievement ? addXp(achievement.xp, achievement.title) : withAchievement;
}

export function completeDailyCheckIn() {
  const today = new Date().toISOString().slice(0, 10);
  const current = getGamificationState();

  const alreadyCheckedIn = current.lastCheckInDate === today;

  const next = {
    ...current,
    streak: alreadyCheckedIn ? current.streak : current.streak + 1,
    lastCheckInDate: today,
  };

  saveGamificationState(next);

  const afterXp = alreadyCheckedIn
    ? next
    : addXp(25, "Daily check-in");

  if (afterXp.streak >= 7) {
    return unlockAchievement("seven-day-streak");
  }

  return afterXp;
}

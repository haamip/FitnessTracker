/**
 * TrackFit demo seed data.
 *
 * Creates realistic local demo records so development and phone testing do not
 * require manually typing workouts, check-ins and cardio every session.
 */

const WORKOUT_HISTORY_KEY = "trackfit_workout_history";
const CHECKINS_KEY = "trackfit_checkins";
const CARDIO_KEY = "trackfit_cardio";

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function createWorkout(id, daysBack, title, completedSets, totalSets, volume, prs = []) {
  return {
    id,
    title,
    completedAt: daysAgo(daysBack),
    seconds: 2700 + daysBack * 120,
    completedSets,
    totalSets,
    volume,
    prs,
    exercises: [],
    notes: "Demo training session for TrackFit testing.",
  };
}

export function seedDemoData() {
  const workouts = [
    createWorkout("demo-upper-1", 0, "Upper Strength", 16, 18, 7420, [{ exerciseName: "Bench Press" }]),
    createWorkout("demo-lower-1", 1, "Lower Strength", 15, 18, 9800),
    createWorkout("demo-push-1", 3, "Push Day", 14, 16, 6650, [{ exerciseName: "Shoulder Press" }]),
    createWorkout("demo-pull-1", 5, "Pull Day", 15, 17, 7100),
  ];

  const checkins = Array.from({ length: 7 }, (_, index) => ({
    id: `demo-checkin-${index}`,
    date: daysAgo(index),
    protein: 175 + index * 3,
    water: 3.2 + index * 0.1,
    sleep: 6.5 + (index % 3) * 0.4,
    trained: index % 2 === 0,
    weight: 104.8 - index * 0.15,
  }));

  const cardio = [
    { id: "demo-cardio-1", date: daysAgo(0), type: "Incline Walk", distance: 3.2, duration: 28 },
    { id: "demo-cardio-2", date: daysAgo(2), type: "Bike", distance: 8.4, duration: 24 },
    { id: "demo-cardio-3", date: daysAgo(4), type: "Walk", distance: 4.1, duration: 38 },
  ];

  localStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(workouts));
  localStorage.setItem(CHECKINS_KEY, JSON.stringify(checkins));
  localStorage.setItem(CARDIO_KEY, JSON.stringify(cardio));

  return workouts;
}

export function clearDemoData() {
  localStorage.removeItem(WORKOUT_HISTORY_KEY);
  localStorage.removeItem(CHECKINS_KEY);
  localStorage.removeItem(CARDIO_KEY);
}

import { readWorkoutHistory } from "./workoutEngine";

const muscleRecoveryHours = {
  chest: 72,
  shoulders: 60,
  triceps: 48,
  biceps: 48,
  lats: 60,
  middle_back: 60,
  lower_back: 72,
  quadriceps: 72,
  hamstrings: 72,
  glutes: 72,
  calves: 36,
  abdominals: 36,
};

/**
 * Estimates muscle recovery from the last time a muscle group was trained.
 *
 * This is deliberately simple for v0.5. It gives the Dashboard useful coaching
 * without pretending to be medical-grade recovery science.
 */
export function calculateMuscleRecovery(history = readWorkoutHistory()) {
  const now = Date.now();
  const recovery = new Map();

  history.forEach((workout) => {
    const completedAt = new Date(workout.completedAt).getTime();
    const hoursSince = Math.max(0, (now - completedAt) / 36e5);

    (workout.exercises || []).forEach((exercise) => {
      (exercise.primaryMuscles || []).forEach((muscle) => {
        const neededHours = muscleRecoveryHours[muscle] || 48;
        const score = Math.min(100, Math.round((hoursSince / neededHours) * 100));
        const existing = recovery.get(muscle);

        if (!existing || completedAt > existing.completedAt) {
          recovery.set(muscle, { muscle, score, completedAt, neededHours });
        }
      });
    });
  });

  return [...recovery.values()].sort((a, b) => a.score - b.score);
}

/**
 * Creates a short coach sentence for the Dashboard.
 */
export function getRecoveryCoachNote(history = readWorkoutHistory()) {
  const recovery = calculateMuscleRecovery(history);

  if (recovery.length === 0) {
    return "Log a workout and TrackFit will start estimating what is ready to train.";
  }

  const mostFatigued = recovery[0];
  const ready = recovery.filter((item) => item.score >= 85).slice(0, 2);

  if (mostFatigued.score < 60) {
    return `${mostFatigued.muscle.replaceAll("_", " ")} is still recovering. Train around it or keep the volume lighter.`;
  }

  if (ready.length > 0) {
    return `${ready.map((item) => item.muscle.replaceAll("_", " ")).join(" and ")} look ready. Good day to push.`;
  }

  return "Recovery is building. Keep today's session controlled and log clean reps.";
}

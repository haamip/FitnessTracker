// Unfinished workouts are local-only until the user taps Save workout.
// Each account and edited template has its own draft so logins cannot see
// another account's unsaved training data on a shared browser.
const PREFIX = "trackfit_workout_builder_draft_v1";

function storageKey(accountId, editId) {
  if (!accountId) return null;
  const scope = editId ? `edit:${encodeURIComponent(editId)}` : "new";
  return `${PREFIX}:${encodeURIComponent(accountId)}:${scope}`;
}

export const WorkoutBuilderDraftRepository = {
  get(accountId, editId = null) {
    const key = storageKey(accountId, editId);
    if (!key) return null;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const draft = JSON.parse(raw);
      if (draft?.version !== 1 || typeof draft.name !== "string" ||
          !Array.isArray(draft.exercises) ||
          !draft.exercises.every(exercise => exercise && typeof exercise.id === "string" &&
            Array.isArray(exercise.sets))) return null;
      return { name: draft.name, exercises: draft.exercises };
    } catch {
      // Private browsing, disabled storage, or corrupt older data must not crash the builder.
      return null;
    }
  },

  save(accountId, editId, { name, exercises }) {
    const key = storageKey(accountId, editId);
    if (!key || typeof name !== "string" || !Array.isArray(exercises)) return false;
    try {
      localStorage.setItem(key, JSON.stringify({
        version: 1,
        name,
        exercises,
        updatedAt: new Date().toISOString(),
      }));
      return true;
    } catch (error) {
      console.warn("Could not save unfinished workout to this device.", error);
      return false;
    }
  },

  clear(accountId, editId = null) {
    const key = storageKey(accountId, editId);
    if (!key) return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn("Could not clear workout draft on this device.", error);
    }
  },
};

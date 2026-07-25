import { supabase } from "../supabase";
import { readJson, writeJson } from "../utils/storage";

const SAVED_WORKOUTS_KEY = "trackfit_saved_workouts";
const AI_PLAN_KEY = "trackfit_ai_workout_plan";
const WORKOUT_KEY_PREFIX = "trackfit_workout_";

async function getUser() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user || null;
}

function newestFirst(left, right) {
  return new Date(right.updated_at || right.created_at || 0) - new Date(left.updated_at || left.created_at || 0);
}

function mapTemplate(row) {
  return {
    id: row.local_id || row.id,
    cloudId: row.id,
    name: row.name,
    detail: row.detail || "",
    exercises: row.exercises || [],
    updatedAt: row.updated_at,
  };
}

export const TrainingCloudRepository = {
  async hydrate() {
    const user = await getUser();
    if (!user) return;

    const [{ data: templates, error: templateError }, { data: plans, error: planError }, { data: drafts, error: draftError }] = await Promise.all([
      supabase.from("workout_templates").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }),
      supabase.from("training_plans").select("*").eq("user_id", user.id).eq("is_active", true).order("updated_at", { ascending: false }).limit(1),
      supabase.from("workout_sessions").select("*").eq("user_id", user.id).eq("status", "active").order("updated_at", { ascending: false }),
    ]);

    if (templateError) throw templateError;
    if (planError) throw planError;
    if (draftError) throw draftError;

    if (templates?.length) {
      writeJson(SAVED_WORKOUTS_KEY, templates.sort(newestFirst).map(mapTemplate));
    }

    const activePlan = plans?.[0];
    if (activePlan?.plan_data) writeJson(AI_PLAN_KEY, activePlan.plan_data);

    for (const draft of drafts || []) {
      if (draft.local_id && Array.isArray(draft.exercises)) {
        writeJson(`${WORKOUT_KEY_PREFIX}${draft.local_id}`, draft.exercises);
      }
    }
  },

  async saveTemplate(workout) {
    const user = await getUser();
    if (!user || !workout?.id) return null;

    const payload = {
      user_id: user.id,
      local_id: String(workout.id),
      name: workout.name || "Saved workout",
      detail: workout.detail || null,
      exercises: workout.exercises || [],
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("workout_templates")
      .upsert(payload, { onConflict: "user_id,local_id" })
      .select()
      .single();

    if (error) throw error;
    return mapTemplate(data);
  },

  async deleteTemplate(localId) {
    const user = await getUser();
    if (!user) return;
    const { error } = await supabase
      .from("workout_templates")
      .delete()
      .eq("user_id", user.id)
      .eq("local_id", String(localId));
    if (error) throw error;
  },

  async savePlan(plan) {
    const user = await getUser();
    if (!user) return;

    const { data: existing, error: readError } = await supabase
      .from("training_plans")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (readError) throw readError;

    const payload = {
      user_id: user.id,
      name: "My plan",
      plan_data: plan || [],
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    const query = existing?.id
      ? supabase.from("training_plans").update(payload).eq("id", existing.id)
      : supabase.from("training_plans").insert(payload);
    const { error } = await query;
    if (error) throw error;
  },

  async clearPlan() {
    const user = await getUser();
    if (!user) return;
    const { error } = await supabase
      .from("training_plans")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("is_active", true);
    if (error) throw error;
  },

  async saveActiveWorkout(localId, exercises) {
    const user = await getUser();
    if (!user || !localId) return;

    const now = new Date().toISOString();
    const payload = {
      user_id: user.id,
      local_id: String(localId),
      title: "Active workout",
      status: "active",
      started_at: now,
      completed_at: null,
      exercises: exercises || [],
      updated_at: now,
    };

    const { error } = await supabase
      .from("workout_sessions")
      .upsert(payload, { onConflict: "user_id,local_id" });
    if (error) throw error;
  },

  async removeActiveWorkout(localId) {
    const user = await getUser();
    if (!user || !localId) return;
    const { error } = await supabase
      .from("workout_sessions")
      .delete()
      .eq("user_id", user.id)
      .eq("local_id", String(localId))
      .eq("status", "active");
    if (error) throw error;
  },
};

export function getCachedTemplate(localId) {
  return readJson(SAVED_WORKOUTS_KEY, []).find((item) => item.id === localId) || null;
}

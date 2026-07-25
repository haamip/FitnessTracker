import { isSupabaseConfigured, supabase } from "../supabaseClient";

function normalizeExerciseName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function mapExercise(row) {
  if (!row) return null;

  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    normalizedName: row.normalized_name,
    aliases: row.aliases || [],
    equipment: row.equipment || "",
    primaryMuscles: row.primary_muscles || [],
    secondaryMuscles: row.secondary_muscles || [],
    category: row.category || "",
    instructions: row.instructions || [],
    setup: row.setup || "",
    commonMistakes: row.common_mistakes || [],
    tips: row.tips || [],
    difficulty: row.difficulty || "",
    sourceName: row.source_name || "",
    sourceUrl: row.source_url || "",
    sourceExternalId: row.source_external_id || "",
    verified: Boolean(row.verified),
    status: row.status,
  };
}

export const ExerciseRepository = {
  normalizeName: normalizeExerciseName,

  async findByName(name) {
    if (!isSupabaseConfigured) return null;

    const normalizedName = normalizeExerciseName(name);
    if (!normalizedName) return null;

    const { data, error } = await supabase
      .from("exercises")
      .select("*")
      .eq("normalized_name", normalizedName)
      .order("owner_id", { ascending: true, nullsFirst: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return mapExercise(data);
  },

  async createPending(name, ownerId) {
    if (!isSupabaseConfigured) return null;

    const cleanName = String(name || "").trim();
    const normalizedName = normalizeExerciseName(cleanName);
    if (!cleanName || !normalizedName || !ownerId) return null;

    const { data, error } = await supabase
      .from("exercises")
      .upsert(
        {
          owner_id: ownerId,
          name: cleanName,
          normalized_name: normalizedName,
          status: "pending_instructions",
          verified: false,
        },
        { onConflict: "owner_id,normalized_name" },
      )
      .select("*")
      .single();

    if (error) throw error;
    return mapExercise(data);
  },

  async findOrCreatePending(name, ownerId) {
    const existing = await this.findByName(name);
    if (existing) return { exercise: existing, created: false };

    const exercise = await this.createPending(name, ownerId);
    return { exercise, created: Boolean(exercise) };
  },

  async updateInstructions(exerciseId, details) {
    if (!isSupabaseConfigured || !exerciseId) return null;

    const { data, error } = await supabase
      .from("exercises")
      .update({
        equipment: details.equipment || null,
        primary_muscles: details.primaryMuscles || [],
        secondary_muscles: details.secondaryMuscles || [],
        category: details.category || null,
        instructions: details.instructions || [],
        setup: details.setup || null,
        common_mistakes: details.commonMistakes || [],
        tips: details.tips || [],
        difficulty: details.difficulty || null,
        source_name: details.sourceName || null,
        source_url: details.sourceUrl || null,
        source_external_id: details.sourceExternalId || null,
        status: details.verified ? "ready" : "needs_review",
        verified: Boolean(details.verified),
        updated_at: new Date().toISOString(),
      })
      .eq("id", exerciseId)
      .select("*")
      .single();

    if (error) throw error;
    return mapExercise(data);
  },
};

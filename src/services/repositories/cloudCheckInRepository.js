import { supabase } from "../supabase";
import { CheckInRepository } from "./trackfitDataLayer";

function toNumber(value) {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : 0;
}

function fromRow(row) {
  return {
    id: row.id,
    date: row.checkin_date,
    weightKg: toNumber(row.weight_kg),
    proteinG: toNumber(row.protein_g),
    waterL: toNumber(row.water_l),
    sleepHours: toNumber(row.sleep_hours),
    mood: row.mood || "Okay",
    energy: Number(row.energy || 5),
    bodyFeel: row.body_feel || "Mild",
    trainedToday: Boolean(row.trained_today),
    trainingNote: row.training_note || "",
  };
}

function cache(checkIns) {
  CheckInRepository.saveAll(checkIns);
  return checkIns;
}

export const CloudCheckInRepository = {
  getCached() {
    return CheckInRepository.getAll();
  },

  async getAll() {
    if (!supabase) return this.getCached();

    const { data, error } = await supabase
      .from("daily_checkins")
      .select("*")
      .order("checkin_date", { ascending: false });

    if (error) throw error;
    return cache((data || []).map(fromRow));
  },

  async save(checkIn) {
    const cached = [
      checkIn,
      ...this.getCached().filter((item) => item.date !== checkIn.date),
    ];
    cache(cached);

    if (!supabase) return checkIn;

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) throw new Error("You must be signed in to save a check-in.");

    const payload = {
      user_id: userData.user.id,
      checkin_date: checkIn.date,
      weight_kg: toNumber(checkIn.weightKg),
      protein_g: toNumber(checkIn.proteinG),
      water_l: toNumber(checkIn.waterL),
      sleep_hours: toNumber(checkIn.sleepHours),
      mood: checkIn.mood,
      energy: Math.round(toNumber(checkIn.energy)),
      body_feel: checkIn.bodyFeel,
      trained_today: Boolean(checkIn.trainedToday),
      training_note: checkIn.trainingNote || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("daily_checkins")
      .upsert(payload, { onConflict: "user_id,checkin_date" })
      .select()
      .single();

    if (error) throw error;

    const saved = fromRow(data);
    cache([saved, ...cached.filter((item) => item.date !== saved.date)]);
    return saved;
  },
};

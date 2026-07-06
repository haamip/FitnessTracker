import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Battery,
  BedDouble,
  CheckCircle2,
  Dumbbell,
  Flame,
  HeartPulse,
  Moon,
  Save,
  Scale,
  Sparkles,
  SunMedium,
  Utensils,
  Waves,
} from "lucide-react";

import Button from "../components/ui/Button";
import { completeDailyCheckIn } from "../features/gamification/gamification";
import { CheckInRepository } from "../services/repositories/trackfitDataLayer";
import "./TrackFitScreens.css";

const initialForm = {
  weightKg: "",
  proteinG: "",
  waterL: "",
  sleepHours: "",
  mood: "Good",
  energy: "7",
  soreness: "Mild",
  trained: "Yes",
  trainingNote: "Upper strength",
};

function toNumber(value) {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : 0;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getTodayLabel() {
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    day: "numeric",
  }).format(new Date());
}

function normaliseCheckIn(checkIn) {
  return {
    id: checkIn.id || `checkin-${checkIn.date || todayKey()}`,
    date: checkIn.date || todayKey(),
    weightKg: toNumber(checkIn.weightKg ?? checkIn.weight),
    proteinG: Math.round(toNumber(checkIn.proteinG ?? checkIn.protein)),
    waterL: toNumber(checkIn.waterL ?? checkIn.water),
    sleepHours: toNumber(checkIn.sleepHours ?? checkIn.sleep),
    mood: checkIn.mood || "Good",
    energy: Math.round(toNumber(checkIn.energy || 7)),
    soreness: checkIn.soreness || "Mild",
    trained: checkIn.trained || "Yes",
    trainingNote: checkIn.trainingNote || "Upper strength",
    savedAt: checkIn.savedAt || new Date().toISOString(),
  };
}

function calculateReadiness(checkIn) {
  const sleepScore = Math.min(30, (checkIn.sleepHours / 8) * 30);
  const waterScore = Math.min(20, (checkIn.waterL / 4) * 20);
  const proteinScore = Math.min(25, (checkIn.proteinG / 185) * 25);
  const energyScore = Math.min(25, (checkIn.energy / 10) * 25);
  return Math.round(sleepScore + waterScore + proteinScore + energyScore);
}

function buildCheckItems(checkIn) {
  return [
    {
      icon: Scale,
      label: "Weight",
      value: checkIn.weightKg ? `${checkIn.weightKg.toFixed(1)}kg` : "--",
      note: "Daily bodyweight",
    },
    {
      icon: Utensils,
      label: "Protein",
      value: `${checkIn.proteinG}g`,
      note: `${Math.max(0, 185 - checkIn.proteinG)}g to target`,
    },
    {
      icon: Waves,
      label: "Water",
      value: `${checkIn.waterL.toFixed(1)}L`,
      note: "Goal 4L",
    },
    {
      icon: BedDouble,
      label: "Sleep",
      value: `${checkIn.sleepHours.toFixed(1)}h`,
      note: checkIn.sleepHours >= 7 ? "Good recovery" : "Needs attention",
    },
  ];
}

function buildRecovery(checkIn) {
  return [
    { label: "Mood", value: checkIn.mood, icon: SunMedium },
    { label: "Energy", value: `${checkIn.energy}/10`, icon: Battery },
    { label: "Soreness", value: checkIn.soreness, icon: HeartPulse },
  ];
}

/**
 * DailyCheckIn
 *
 * Stores daily health inputs through CheckInRepository so Coach Intelligence can
 * use recovery, nutrition and readiness signals later.
 */
export default function DailyCheckIn() {
  const [savedCheckIns, setSavedCheckIns] = useState(() =>
    CheckInRepository.getAll().map(normaliseCheckIn),
  );
  const todayCheckIn = savedCheckIns.find((item) => item.date === todayKey());
  const [form, setForm] = useState(() =>
    todayCheckIn
      ? {
          weightKg: todayCheckIn.weightKg || "",
          proteinG: todayCheckIn.proteinG || "",
          waterL: todayCheckIn.waterL || "",
          sleepHours: todayCheckIn.sleepHours || "",
          mood: todayCheckIn.mood,
          energy: todayCheckIn.energy || "7",
          soreness: todayCheckIn.soreness,
          trained: todayCheckIn.trained,
          trainingNote: todayCheckIn.trainingNote,
        }
      : initialForm,
  );

  const previewCheckIn = useMemo(
    () =>
      normaliseCheckIn({
        ...form,
        date: todayKey(),
      }),
    [form],
  );
  const readiness = calculateReadiness(previewCheckIn);
  const checkItems = buildCheckItems(previewCheckIn);
  const recovery = buildRecovery(previewCheckIn);
  const [dayName, dayNumber] = getTodayLabel().split(" ");

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const record = normaliseCheckIn({
      ...form,
      id: `checkin-${todayKey()}`,
      date: todayKey(),
      savedAt: new Date().toISOString(),
    });
    const withoutToday = savedCheckIns.filter((item) => item.date !== record.date);
    const nextCheckIns = [record, ...withoutToday];

    CheckInRepository.saveAll(nextCheckIns);
    setSavedCheckIns(nextCheckIns);
    completeDailyCheckIn();
  }

  return (
    <motion.form
      className="screen checkin-v4"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      onSubmit={handleSubmit}
    >
      <section className="v4-checkin-hero">
        <div>
          <p className="eyebrow">Daily check-in</p>
          <h1>Today</h1>
          <p>Log the basics. The boring stuff is what moves the needle.</p>
        </div>

        <div className="v4-checkin-date">
          <span>{dayName}</span>
          <strong>{dayNumber}</strong>
        </div>
      </section>

      <section className="v4-checkin-score">
        <div>
          <p className="eyebrow">Readiness</p>
          <h2>{readiness}%</h2>
          <span>
            {readiness >= 75
              ? "Good day to train, but keep recovery in mind."
              : "Recovery needs attention. Train smart, not reckless."}
          </span>
        </div>

        <div className="v4-checkin-ring" style={{ "--progress": `${readiness}%` }}>
          <div>
            <CheckCircle2 size={24} />
          </div>
        </div>
      </section>

      <section className="form-card form-grid">
        <div>
          <p className="eyebrow">Inputs</p>
          <h2>Today's numbers</h2>
          <p>These feed the coach, recovery and nutrition decisions later.</p>
        </div>

        <label>
          Weight kg
          <input
            inputMode="decimal"
            min="0"
            placeholder="104.2"
            type="number"
            value={form.weightKg}
            onChange={(event) => updateField("weightKg", event.target.value)}
          />
        </label>

        <label>
          Protein grams
          <input
            inputMode="numeric"
            min="0"
            placeholder="185"
            type="number"
            value={form.proteinG}
            onChange={(event) => updateField("proteinG", event.target.value)}
          />
        </label>

        <label>
          Water litres
          <input
            inputMode="decimal"
            min="0"
            placeholder="4.0"
            type="number"
            value={form.waterL}
            onChange={(event) => updateField("waterL", event.target.value)}
          />
        </label>

        <label>
          Sleep hours
          <input
            inputMode="decimal"
            min="0"
            placeholder="7.5"
            type="number"
            value={form.sleepHours}
            onChange={(event) => updateField("sleepHours", event.target.value)}
          />
        </label>
      </section>

      <div className="v4-section-heading">
        <div>
          <p className="eyebrow">Summary</p>
          <h2>Today so far</h2>
        </div>
        <span>{todayCheckIn ? "Saved" : "Live"}</span>
      </div>

      <section className="v4-check-grid">
        {checkItems.map((item) => (
          <article className="v4-check-card" key={item.label}>
            <item.icon size={21} />
            <strong>{item.value}</strong>
            <span>{item.label}</span>
            <small>{item.note}</small>
          </article>
        ))}
      </section>

      <section className="form-card form-grid">
        <div>
          <p className="eyebrow">Recovery</p>
          <h2>How you feel</h2>
        </div>

        <label>
          Mood
          <select
            value={form.mood}
            onChange={(event) => updateField("mood", event.target.value)}
          >
            <option>Great</option>
            <option>Good</option>
            <option>Flat</option>
            <option>Stressed</option>
            <option>Cooked</option>
          </select>
        </label>

        <label>
          Energy 1-10
          <input
            inputMode="numeric"
            max="10"
            min="1"
            type="number"
            value={form.energy}
            onChange={(event) => updateField("energy", event.target.value)}
          />
        </label>

        <label>
          Soreness
          <select
            value={form.soreness}
            onChange={(event) => updateField("soreness", event.target.value)}
          >
            <option>None</option>
            <option>Mild</option>
            <option>Moderate</option>
            <option>High</option>
          </select>
        </label>
      </section>

      <section className="v4-training-toggle">
        <div>
          <p className="eyebrow">Training today?</p>
          <h2>{form.trained === "Yes" ? "Yes" : "No"}</h2>
          <span>{form.trainingNote || "Add a short note for the coach."}</span>
        </div>

        <div className="v4-training-pill">
          <Dumbbell size={17} />
          {form.trained}
        </div>
      </section>

      <section className="form-card form-grid">
        <label>
          Trained today
          <select
            value={form.trained}
            onChange={(event) => updateField("trained", event.target.value)}
          >
            <option>Yes</option>
            <option>No</option>
          </select>
        </label>

        <label>
          Training note
          <input
            placeholder="Upper strength, cardio, rest day..."
            type="text"
            value={form.trainingNote}
            onChange={(event) => updateField("trainingNote", event.target.value)}
          />
        </label>
      </section>

      <section className="v4-recovery-list">
        {recovery.map((item) => (
          <article className="v4-recovery-row" key={item.label}>
            <div className="v4-icon-bubble small">
              <item.icon size={18} />
            </div>

            <div>
              <strong>{item.label}</strong>
              <span>{item.value}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="v4-ai-insight">
        <div className="v4-icon-bubble">
          <Sparkles size={22} />
        </div>

        <div>
          <p className="eyebrow">Coach note</p>
          <h2>{previewCheckIn.proteinG >= 185 ? "Protein target hit." : "Protein is the next easy win."}</h2>
          <p>
            {previewCheckIn.proteinG >= 185
              ? "Good work. Keep water and sleep steady so the training engine can recover."
              : "Hit another small protein meal and keep water moving. Boring basics, big result."}
          </p>
        </div>
      </section>

      <Button className="v4-save-checkin" type="submit">
        <Save size={18} />
        Save check-in
      </Button>

      <section className="v4-mini-summary">
        <Moon size={18} />
        <span>Track the simple stuff daily. That is how the app gets smart.</span>
        <Flame size={18} />
      </section>
    </motion.form>
  );
}

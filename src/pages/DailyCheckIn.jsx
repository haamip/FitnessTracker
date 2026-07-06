/*
 * TRACKFIT PAGE
 *
 * Purpose:
 * Main responsibility of this page.
 *
 * Data:
 * Repository and services used by this page.
 *
 * Features:
 * - Feature 1
 * - Feature 2
 * - Feature 3
 *
 * Future:
 * Planned improvements after MVP.
 */
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

const today = new Date().toISOString().slice(0, 10);

const initialForm = {
  weightKg: "104.2",
  proteinG: "168",
  waterL: "3.2",
  sleepHours: "7.4",
  mood: "Good",
  energy: "7",
  bodyFeel: "Mild",
  trainedToday: "yes",
  trainingNote: "Upper strength",
};

function toNumber(value) {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : 0;
}

function normaliseCheckIn(checkIn, index = 0) {
  return {
    id: checkIn.id || `legacy-checkin-${index}`,
    date: checkIn.date || checkIn.completedAt || today,
    weightKg: toNumber(checkIn.weightKg ?? checkIn.weight),
    proteinG: Math.round(toNumber(checkIn.proteinG ?? checkIn.protein)),
    waterL: toNumber(checkIn.waterL ?? checkIn.water),
    sleepHours: toNumber(checkIn.sleepHours ?? checkIn.sleep),
    mood: checkIn.mood || "Okay",
    energy: Math.round(toNumber(checkIn.energy ?? 5)),
    bodyFeel: checkIn.bodyFeel || checkIn.soreness || "Mild",
    trainedToday: Boolean(checkIn.trainedToday ?? checkIn.trained),
    trainingNote: checkIn.trainingNote || "",
  };
}

function buildFormFromCheckIn(checkIn) {
  if (!checkIn) return initialForm;

  const saved = normaliseCheckIn(checkIn);

  return {
    weightKg: saved.weightKg ? String(saved.weightKg) : "",
    proteinG: saved.proteinG ? String(saved.proteinG) : "",
    waterL: saved.waterL ? String(saved.waterL) : "",
    sleepHours: saved.sleepHours ? String(saved.sleepHours) : "",
    mood: saved.mood,
    energy: saved.energy ? String(saved.energy) : "5",
    bodyFeel: saved.bodyFeel,
    trainedToday: saved.trainedToday ? "yes" : "no",
    trainingNote: saved.trainingNote,
  };
}

function getScore(form) {
  const sleep = Math.min(25, (toNumber(form.sleepHours) / 8) * 25);
  const water = Math.min(20, (toNumber(form.waterL) / 4) * 20);
  const protein = Math.min(20, (toNumber(form.proteinG) / 185) * 20);
  const energy = Math.min(25, (toNumber(form.energy) / 10) * 25);
  const body =
    form.bodyFeel === "High" ? -12 : form.bodyFeel === "Moderate" ? -6 : 0;

  return Math.max(
    0,
    Math.min(100, Math.round(sleep + water + protein + energy + body)),
  );
}

function formatToday() {
  const date = new Date();

  return {
    day: new Intl.DateTimeFormat("en-AU", { weekday: "short" }).format(date),
    date: new Intl.DateTimeFormat("en-AU", { day: "numeric" }).format(date),
  };
}

export default function DailyCheckIn() {
  const [savedCheckIns, setSavedCheckIns] = useState(() =>
    CheckInRepository.getAll().map(normaliseCheckIn),
  );
  const existingToday = savedCheckIns.find((checkIn) => checkIn.date === today);
  const [form, setForm] = useState(() => buildFormFromCheckIn(existingToday));
  const score = useMemo(() => getScore(form), [form]);
  const todayLabel = formatToday();

  const checkItems = [
    {
      icon: Scale,
      label: "Weight",
      value: `${toNumber(form.weightKg).toFixed(1)}kg`,
      note: existingToday ? "Saved today" : "Ready to save",
    },
    {
      icon: Utensils,
      label: "Protein",
      value: `${Math.round(toNumber(form.proteinG))}g`,
      note: `${Math.max(0, 185 - Math.round(toNumber(form.proteinG)))}g to target`,
    },
    {
      icon: Waves,
      label: "Water",
      value: `${toNumber(form.waterL).toFixed(1)}L`,
      note: "Goal 4L",
    },
    {
      icon: BedDouble,
      label: "Sleep",
      value: `${toNumber(form.sleepHours).toFixed(1)}h`,
      note: toNumber(form.sleepHours) >= 7 ? "Solid" : "Low",
    },
  ];

  const recovery = [
    { label: "Mood", value: form.mood, icon: SunMedium },
    { label: "Energy", value: `${form.energy}/10`, icon: Battery },
    { label: "Body feel", value: form.bodyFeel, icon: HeartPulse },
  ];

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const newCheckIn = normaliseCheckIn({
      id: existingToday?.id || `checkin-${Date.now()}`,
      date: today,
      weightKg: form.weightKg,
      proteinG: form.proteinG,
      waterL: form.waterL,
      sleepHours: form.sleepHours,
      mood: form.mood,
      energy: form.energy,
      bodyFeel: form.bodyFeel,
      trainedToday: form.trainedToday === "yes",
      trainingNote: form.trainingNote,
    });

    const nextCheckIns = [
      newCheckIn,
      ...savedCheckIns.filter((checkIn) => checkIn.date !== today),
    ];

    CheckInRepository.saveAll(nextCheckIns);
    completeDailyCheckIn();
    setSavedCheckIns(nextCheckIns);
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
          <span>{todayLabel.day}</span>
          <strong>{todayLabel.date}</strong>
        </div>
      </section>

      <section className="v4-checkin-score">
        <div>
          <p className="eyebrow">Readiness</p>
          <h2>{score}%</h2>
          <span>Based on today&apos;s logged inputs.</span>
        </div>

        <div className="v4-checkin-ring" style={{ "--progress": `${score}%` }}>
          <div>
            <CheckCircle2 size={24} />
          </div>
        </div>
      </section>

      <div className="v4-section-heading">
        <div>
          <p className="eyebrow">Inputs</p>
          <h2>Today&apos;s numbers</h2>
        </div>
        <span>{existingToday ? "Saved" : "Live"}</span>
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
        <label>
          Weight kg
          <input
            inputMode="decimal"
            min="0"
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
            type="number"
            value={form.sleepHours}
            onChange={(event) => updateField("sleepHours", event.target.value)}
          />
        </label>
      </section>

      <section className="v4-training-toggle">
        <div>
          <p className="eyebrow">Training today?</p>
          <h2>{form.trainedToday === "yes" ? "Yes" : "No"}</h2>
          <span>
            {form.trainingNote || "Add a short training note if needed."}
          </span>
        </div>

        <div className="v4-training-pill">
          <Dumbbell size={17} />
          {form.trainedToday === "yes" ? "Done" : "Rest"}
        </div>
      </section>

      <section className="form-card form-grid">
        <label>
          Trained today
          <select
            value={form.trainedToday}
            onChange={(event) =>
              updateField("trainedToday", event.target.value)
            }
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>

        <label>
          Training note
          <input
            placeholder="Upper strength, cardio, rest day..."
            type="text"
            value={form.trainingNote}
            onChange={(event) =>
              updateField("trainingNote", event.target.value)
            }
          />
        </label>
      </section>

      <div className="v4-section-heading">
        <div>
          <p className="eyebrow">Recovery</p>
          <h2>How you feel</h2>
        </div>
      </div>

      <section className="form-card form-grid">
        <label>
          Mood
          <select
            value={form.mood}
            onChange={(event) => updateField("mood", event.target.value)}
          >
            <option>Great</option>
            <option>Good</option>
            <option>Okay</option>
            <option>Flat</option>
            <option>Rough</option>
          </select>
        </label>

        <label>
          Energy /10
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
          Body feel
          <select
            value={form.bodyFeel}
            onChange={(event) => updateField("bodyFeel", event.target.value)}
          >
            <option>Low</option>
            <option>Mild</option>
            <option>Moderate</option>
            <option>High</option>
          </select>
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
          <h2>Daily data is now connected.</h2>
          <p>
            Saved check-ins now feed the repository layer for future Coach and
            nutrition decisions.
          </p>
        </div>
      </section>

      <Button className="v4-save-checkin" type="submit">
        <Save size={18} />
        Save check-in
      </Button>

      <section className="v4-mini-summary">
        <Moon size={18} />
        <span>
          Track the simple stuff daily. That is how the app gets smart.
        </span>
        <Flame size={18} />
      </section>
    </motion.form>
  );
}

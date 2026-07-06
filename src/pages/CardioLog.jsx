import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Bike,
  Clock,
  Flame,
  Footprints,
  HeartPulse,
  Plus,
  Route,
  Sparkles,
  Timer,
  Zap,
} from "lucide-react";

import Button from "../components/ui/Button";
import LineChartCard from "../components/LineChartCard";
import { CardioRepository } from "../services/repositories/trackfitDataLayer";
import "./TrackFitScreens.css";

const CARDIO_TYPES = [
  "Incline Walk",
  "Treadmill",
  "Outdoor Walk",
  "Run",
  "Bike",
  "Rower",
  "Stair Climber",
  "Other",
];

const demoSessions = [
  {
    id: "demo-cardio-1",
    date: new Date().toISOString().slice(0, 10),
    type: "Incline Walk",
    distanceKm: 3.6,
    durationMin: 32,
    steps: 6200,
    calories: 280,
    zone: "Zone 2",
  },
  {
    id: "demo-cardio-2",
    date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    type: "Bike",
    distanceKm: 8.4,
    durationMin: 26,
    steps: 0,
    calories: 340,
    zone: "Zone 3",
  },
  {
    id: "demo-cardio-3",
    date: new Date(Date.now() - 172800000).toISOString().slice(0, 10),
    type: "Treadmill",
    distanceKm: 2.4,
    durationMin: 20,
    steps: 3800,
    calories: 226,
    zone: "Zone 2",
  },
];

const initialForm = {
  type: "Incline Walk",
  distanceKm: "",
  durationMin: "",
  steps: "",
  calories: "",
  zone: "Zone 2",
};

function toNumber(value) {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : 0;
}

function normaliseSession(session, index = 0) {
  return {
    id: session.id || `legacy-cardio-${index}`,
    date: session.date || session.completedAt || new Date().toISOString().slice(0, 10),
    type: session.type || session.name || "Other",
    distanceKm: toNumber(session.distanceKm ?? session.distance ?? session.km),
    durationMin: toNumber(
      session.durationMin ?? session.duration ?? session.minutes ?? session.time,
    ),
    steps: Math.round(toNumber(session.steps)),
    calories: Math.round(toNumber(session.calories)),
    zone: session.zone || "Zone 2",
  };
}

function formatDateLabel(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Today";

  return new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
  }).format(date);
}

function formatSessionDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Recently";

  return new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

function getPace(distanceKm, durationMin) {
  if (!distanceKm || !durationMin) return "Pace pending";

  const pace = durationMin / distanceKm;
  const minutes = Math.floor(pace);
  const seconds = Math.round((pace - minutes) * 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}/km`;
}

function buildWeeklyChart(sessions) {
  const byDay = new Map();

  sessions.forEach((session) => {
    const label = formatDateLabel(session.date);
    const current = byDay.get(label) || 0;
    byDay.set(label, Math.round((current + session.distanceKm) * 10) / 10);
  });

  return [...byDay.entries()].reverse().map(([date, distance]) => ({
    date,
    distance,
  }));
}

/**
 * CardioLog
 *
 * Movement tracking surface for cardio and steps.
 * Cardio reads and writes through the repository layer so the page is ready
 * for real user data before wearable syncing is added later.
 */
export default function CardioLog() {
  const [savedSessions, setSavedSessions] = useState(() =>
    CardioRepository.getAll().map(normaliseSession),
  );
  const [form, setForm] = useState(initialForm);
  const [selectedType, setSelectedType] = useState("All");

  const sessions = savedSessions.length > 0 ? savedSessions : demoSessions;
  const filteredSessions = useMemo(
    () =>
      selectedType === "All"
        ? sessions
        : sessions.filter((session) => session.type === selectedType),
    [selectedType, sessions],
  );

  const totals = useMemo(
    () =>
      filteredSessions.reduce(
        (summary, session) => ({
          distanceKm: summary.distanceKm + session.distanceKm,
          durationMin: summary.durationMin + session.durationMin,
          calories: summary.calories + session.calories,
          steps: summary.steps + session.steps,
        }),
        { distanceKm: 0, durationMin: 0, calories: 0, steps: 0 },
      ),
    [filteredSessions],
  );

  const chartData = useMemo(
    () => buildWeeklyChart(filteredSessions),
    [filteredSessions],
  );

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const newSession = normaliseSession({
      id: `cardio-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      type: form.type,
      distanceKm: form.distanceKm,
      durationMin: form.durationMin,
      steps: form.steps,
      calories: form.calories,
      zone: form.zone,
    });

    const nextSessions = [newSession, ...savedSessions];
    CardioRepository.saveAll(nextSessions);
    setSavedSessions(nextSessions);
    setSelectedType("All");
    setForm(initialForm);
  }

  return (
    <motion.div
      className="screen cardio-v4"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <section className="v4-cardio-hero">
        <div>
          <p className="eyebrow">Movement</p>
          <h1>{totals.distanceKm.toFixed(1)}km</h1>
          <p>Cardio and steps in one place. Keep the engine ticking over.</p>
        </div>

        <div className="v4-cardio-icon">
          <HeartPulse size={28} />
        </div>
      </section>

      <section className="v4-cardio-stats">
        <article>
          <Route size={21} />
          <strong>{totals.distanceKm.toFixed(1)}km</strong>
          <span>Distance</span>
        </article>

        <article>
          <Footprints size={21} />
          <strong>{totals.steps.toLocaleString()}</strong>
          <span>Steps</span>
        </article>

        <article>
          <Clock size={21} />
          <strong>{Math.round(totals.durationMin)}min</strong>
          <span>Time</span>
        </article>

        <article>
          <Flame size={21} />
          <strong>{totals.calories}</strong>
          <span>Calories</span>
        </article>
      </section>

      <form className="form-card form-grid" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">Log movement</p>
          <h2>Add today's cardio</h2>
          <p>Pick the type, add steps if you have them, and TrackFit will build the graph.</p>
        </div>

        <label>
          Cardio type
          <select
            value={form.type}
            onChange={(event) => updateField("type", event.target.value)}
          >
            {CARDIO_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label>
          Distance km
          <input
            inputMode="decimal"
            min="0"
            placeholder="3.6"
            type="number"
            value={form.distanceKm}
            onChange={(event) => updateField("distanceKm", event.target.value)}
          />
        </label>

        <label>
          Duration minutes
          <input
            inputMode="numeric"
            min="0"
            placeholder="32"
            type="number"
            value={form.durationMin}
            onChange={(event) => updateField("durationMin", event.target.value)}
          />
        </label>

        <label>
          Steps
          <input
            inputMode="numeric"
            min="0"
            placeholder="6200"
            type="number"
            value={form.steps}
            onChange={(event) => updateField("steps", event.target.value)}
          />
        </label>

        <label>
          Calories
          <input
            inputMode="numeric"
            min="0"
            placeholder="280"
            type="number"
            value={form.calories}
            onChange={(event) => updateField("calories", event.target.value)}
          />
        </label>

        <label>
          Effort zone
          <select
            value={form.zone}
            onChange={(event) => updateField("zone", event.target.value)}
          >
            <option>Zone 1</option>
            <option>Zone 2</option>
            <option>Zone 3</option>
            <option>Zone 4</option>
            <option>Zone 5</option>
          </select>
        </label>

        <Button className="v4-save-checkin" type="submit">
          <Plus size={17} />
          Save movement
        </Button>
      </form>

      <section className="form-card form-grid">
        <div>
          <p className="eyebrow">Graph filter</p>
          <h2>Activity view</h2>
          <p>Choose one activity type or view all movement together.</p>
        </div>

        <label>
          Activity
          <select
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value)}
          >
            <option value="All">All activities</option>
            {CARDIO_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
      </section>

      <LineChartCard
        title={`${selectedType} Distance`}
        data={chartData}
        dataKey="distance"
        unit="km"
      />

      <div className="v4-section-heading">
        <div>
          <p className="eyebrow">Recent</p>
          <h2>Movement sessions</h2>
        </div>
        <span>{filteredSessions.length} logged</span>
      </div>

      <section className="v4-cardio-list">
        {filteredSessions.map((session) => (
          <article className="v4-cardio-row" key={session.id}>
            <div className="v4-cardio-row-icon">
              {session.type === "Bike" ? <Bike size={20} /> : <Activity size={20} />}
            </div>

            <div>
              <strong>{session.type}</strong>
              <p>
                {session.distanceKm.toFixed(1)}km - {session.durationMin} min - {getPace(session.distanceKm, session.durationMin)}
              </p>
              <p>
                {formatSessionDate(session.date)} - {session.steps.toLocaleString()} steps
              </p>
            </div>

            <span>{session.zone}</span>
          </article>
        ))}
      </section>

      <section className="v4-zone-card">
        <div>
          <p className="eyebrow">Movement rule</p>
          <h2>Steps count. Cardio counts. Consistency wins.</h2>
          <p>Use the activity filter to see what is actually moving the needle.</p>
        </div>

        <div className="v4-zone-bars">
          <i style={{ height: "42%" }} />
          <i style={{ height: "78%" }} />
          <i style={{ height: "54%" }} />
          <i style={{ height: "30%" }} />
        </div>
      </section>

      <section className="v4-ai-insight">
        <div className="v4-icon-bubble">
          <Sparkles size={22} />
        </div>

        <div>
          <p className="eyebrow">Coach note</p>
          <h2>Movement now has context.</h2>
          <p>
            Cardio type and steps are being saved together, so the coach can compare effort instead of only counting kilometres.
          </p>
        </div>
      </section>

      <section className="v4-mini-summary">
        <Timer size={18} />
        <span>Old-school rule: move more, recover smart, keep showing up.</span>
        <Zap size={18} />
      </section>
    </motion.div>
  );
}

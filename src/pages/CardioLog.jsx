/*
 * TRACKFIT PAGE
 *
 * Cardio logging with Supabase persistence and a local cache fallback.
 */
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Clock,
  Flame,
  Footprints,
  HeartPulse,
  Plus,
  Route,
  Sparkles,
  Timer,
  Zap,
  Trash2,
} from "lucide-react";

import Button from "../components/ui/Button";
import LineChartCard from "../components/LineChartCard";
import { CardioCloudRepository } from "../services/repositories/cardioCloudRepository";
import { CheckInRepository } from "../services/repositories/trackfitDataLayer";
import { buildSevenDayCardio, recentCardioTotals, localDateKey, pacePerKm } from "../services/cardioSummary";
import { signalTrackFitDataChange } from "../hooks/useTrackFitDataRefresh";
import "./TrackFitScreens.css";
import "./CardioLog.css";

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
    date:
      session.date ||
      session.completedAt ||
      new Date().toISOString().slice(0, 10),
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

function formatSessionDate(value) {
  const day = String(value || "").slice(0, 10);
  const d = new Date(day + "T12:00:00");
  return Number.isNaN(d.getTime()) ? "Recently" : new Intl.DateTimeFormat("en-AU", {
    weekday: "short", day: "numeric", month: "short",
  }).format(d);
}

export default function CardioLog() {
  const [savedSessions, setSavedSessions] = useState(() =>
    CardioCloudRepository.getCached().map(normaliseSession),
  );
  const [form, setForm] = useState(initialForm);
  const [selectedType, setSelectedType] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadSessions() {
      try {
        const sessions = await CardioCloudRepository.getAll();
        if (active) setSavedSessions(sessions.map(normaliseSession));
      } catch (error) {
        console.error("Unable to load cardio sessions.", error);
        if (active) setStatusMessage("Using saved offline cardio data.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadSessions();
    return () => {
      active = false;
    };
  }, []);

  const sessions = savedSessions;
  const filteredSessions = useMemo(
    () =>
      selectedType === "All"
        ? sessions
        : sessions.filter((session) => session.type === selectedType),
    [selectedType, sessions],
  );

  const totals = useMemo(() => recentCardioTotals(filteredSessions), [filteredSessions]);
  const chartData = useMemo(() => buildSevenDayCardio(filteredSessions), [filteredSessions]);
  // Steps imported from Samsung Health/Health Connect belong to the daily check-in,
  // not the sum of cardio sessions, otherwise an activity can double count steps.
  const todaySteps = CheckInRepository.getAll().find((record) => record.date === localDateKey());
  const watchSteps = Number(todaySteps?.steps);
  const stepsLabel = todaySteps?.stepsSource === "health_connect" ? "Health Connect" :
    todaySteps?.stepsSource === "apple_health" ? "Apple Health" : "Daily check-in";

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSaving) return;

    const newSession = normaliseSession({
      id: `cardio-${crypto.randomUUID()}`,
      date: localDateKey(),
      type: form.type,
      distanceKm: form.distanceKm,
      durationMin: form.durationMin,
      steps: form.steps,
      calories: form.calories,
      zone: form.zone,
    });

    if (![form.distanceKm, form.durationMin, form.steps, form.calories].some((value) => Number(value) > 0)) {
      setStatusMessage("Enter a distance, duration, steps or calories before saving.");
      return;
    }
    setIsSaving(true);
    setStatusMessage("");

    try {
      const saved = normaliseSession(
        await CardioCloudRepository.add(newSession),
      );
      setSavedSessions((current) => [
        saved,
        ...current.filter(
          (session) => session.id !== newSession.id && session.id !== saved.id,
        ),
      ]);
      setSelectedType("All");
      setForm(initialForm);
      signalTrackFitDataChange();
      setStatusMessage("Movement saved.");
    } catch (error) {
      console.error("Unable to sync cardio session.", error);
      setSavedSessions(
        CardioCloudRepository.getCached().map(normaliseSession),
      );
      setStatusMessage("Saved on this device, but cloud sync failed. Check your connection before logging it again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteSession(session) {
    if (!window.confirm(`Delete your ${session.type} session from ${formatSessionDate(session.date)}?`)) return;
    setRemovingId(session.id);
    setStatusMessage("");
    try {
      const updated = await CardioCloudRepository.remove(session.id);
      setSavedSessions(updated.map(normaliseSession));
      signalTrackFitDataChange();
      setStatusMessage("Cardio session deleted.");
    } catch (error) {
      setStatusMessage(`Could not delete that session: ${error.message || "Please try again"}`);
    } finally {
      setRemovingId(null);
    }
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
          <p>Your past 7 days of cardio, with steps tracked separately so they are not counted twice.</p>
        </div>
        <div className="v4-cardio-icon">
          <HeartPulse size={28} />
        </div>
      </section>

      <section className="v4-cardio-stats">
        <article><Route size={21} /><strong>{totals.distanceKm.toFixed(1)}km</strong><span>Distance</span></article>
        <article><Footprints size={21} /><strong>{todaySteps && Number.isFinite(watchSteps) ? watchSteps.toLocaleString() : "—"}</strong><span>Today’s steps</span></article>
        <article><Clock size={21} /><strong>{Math.round(totals.durationMin)}min</strong><span>Time</span></article>
        <article><Flame size={21} /><strong>{totals.calories}</strong><span>Calories</span></article>
      </section>

      <p className="tf-cardio-explanation">Last 7 calendar days · {totals.count} cardio sessions · {todaySteps ? `Steps from ${stepsLabel}` : "Log or sync a daily check-in to show today's steps"}</p>

      <form className="form-card form-grid" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">Log movement</p>
          <h2>Add today&apos;s cardio</h2>
          <p>Log the activity here. For your full-day watch steps, use Daily check-in rather than logging them twice.</p>
        </div>

        <label>
          Cardio type
          <select value={form.type} onChange={(event) => updateField("type", event.target.value)}>
            {CARDIO_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>

        <label>
          Distance km
          <input inputMode="decimal" min="0" step="0.1" placeholder="3.6" type="number" value={form.distanceKm} onChange={(event) => updateField("distanceKm", event.target.value)} />
        </label>

        <label>
          Duration minutes
          <input inputMode="decimal" min="0" step="0.1" placeholder="32" type="number" value={form.durationMin} onChange={(event) => updateField("durationMin", event.target.value)} />
        </label>

        <label>
          Steps
          <input inputMode="numeric" min="0" step="1" placeholder="6200" type="number" value={form.steps} onChange={(event) => updateField("steps", event.target.value)} />
        </label>

        <label>
          Calories
          <input inputMode="decimal" min="0" step="0.1" placeholder="280" type="number" value={form.calories} onChange={(event) => updateField("calories", event.target.value)} />
        </label>

        <label>
          Effort zone
          <select value={form.zone} onChange={(event) => updateField("zone", event.target.value)}>
            <option>Zone 1</option><option>Zone 2</option><option>Zone 3</option><option>Zone 4</option><option>Zone 5</option>
          </select>
        </label>

        {statusMessage && <p role="status">{statusMessage}</p>}
        <Button className="v4-save-checkin" disabled={isSaving} type="submit">
          <Plus size={17} />
          {isSaving ? "Saving..." : "Save movement"}
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
          <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>
            <option value="All">All activities</option>
            {CARDIO_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
      </section>

      <LineChartCard title={`${selectedType} · Last 7 days`} data={chartData} dataKey="distance" unit="km" />

      <div className="v4-section-heading">
        <div><p className="eyebrow">Recent</p><h2>Movement sessions</h2></div>
        <span>{isLoading ? "Loading..." : `${filteredSessions.length} logged`}</span>
      </div>

      <section className="v4-cardio-list">
        {!isLoading && filteredSessions.length === 0 && <p>No sessions logged in this view yet.</p>}
        {filteredSessions.map((session) => (
          <article className="v4-cardio-row" key={session.id}>
            <div className="v4-cardio-row-icon"><Activity size={20} /></div>
            <div>
              <strong>{session.type}</strong>
              <p>{session.distanceKm.toFixed(1)}km - {session.durationMin} min - {pacePerKm(session.distanceKm, session.durationMin)}</p>
              <p>{formatSessionDate(session.date)} - {session.steps.toLocaleString()} steps</p>
            </div>
            <span>{session.zone}</span>
            <button type="button" className="tf-cardio-delete" aria-label={`Delete ${session.type} on ${formatSessionDate(session.date)}`} disabled={Boolean(removingId)} onClick={() => deleteSession(session)}><Trash2 size={18} /></button>
          </article>
        ))}
      </section>

      <section className="v4-zone-card">
        <div>
          <p className="eyebrow">Movement rule</p>
          <h2>Steps count. Cardio counts. Consistency wins.</h2>
          <p>Use the activity dropdown to see what is actually moving the needle.</p>
        </div>
        <div className="v4-zone-bars"><i style={{ height: "42%" }} /><i style={{ height: "78%" }} /><i style={{ height: "54%" }} /><i style={{ height: "30%" }} /></div>
      </section>

      <section className="v4-ai-insight">
        <div className="v4-icon-bubble"><Sparkles size={22} /></div>
        <div>
          <p className="eyebrow">Coach note</p>
          <h2>Movement now has context.</h2>
          <p>Cardio type and steps are saved together, so the coach can compare effort instead of only counting kilometres.</p>
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

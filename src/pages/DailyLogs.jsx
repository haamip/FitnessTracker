import { useMemo, useState } from "react";
import { Activity, CheckCircle2, Dumbbell, Utensils } from "lucide-react";
import { completeDay, completeSection, getCurrentDayStatus, getDailyLogs } from "../services/dailyLogs/dailyLogService";
import { getShiftMode } from "../services/shift/shiftModeService";
import "./TrackFitScreens.css";
import "./AISuite.css";

const sections = [
  { id: "nutrition", label: "Nutrition", icon: Utensils },
  { id: "training", label: "Training", icon: Dumbbell },
  { id: "cardio", label: "Cardio", icon: Activity },
];

export default function DailyLogs() {
  const [revision, setRevision] = useState(0);
  const mode = getShiftMode();
  const current = useMemo(() => getCurrentDayStatus(mode), [mode, revision]);
  const logs = useMemo(() => getDailyLogs(), [revision]);

  function finishSection(section) {
    completeSection(section, { date: current.date, mode });
    setRevision((value) => value + 1);
  }

  function finishDay() {
    completeDay({ date: current.date, mode });
    setRevision((value) => value + 1);
  }

  return (
    <main className="screen tf-ai-suite">
      <section className="tf-ai-hero">
        <CheckCircle2 size={30} />
        <p className="eyebrow">Daily records</p>
        <h1>{current.date}</h1>
        <p>{mode === "night" ? "Night shift runs from 18:00 to 06:00. After-midnight entries remain on the starting date." : "Day shift closes automatically when the calendar day rolls over."}</p>
      </section>

      <section className="form-card tf-ai-tool-card">
        <div><p className="eyebrow">Active day</p><h2>Complete each area</h2></div>
        {sections.map(({ id, label, icon: Icon }) => {
          const done = current.sections?.[id]?.status === "complete";
          return (
            <button className="tf-ai-primary" disabled={done} key={id} onClick={() => finishSection(id)} type="button">
              <Icon size={18} /> {done ? `${label} complete` : `Complete ${label}`}
            </button>
          );
        })}
        <button className="tf-ai-primary" disabled={current.completed} onClick={finishDay} type="button">
          <CheckCircle2 size={18} /> {current.completed ? "Day completed" : "Complete whole day"}
        </button>
      </section>

      <section className="tf-ai-tool-card">
        <div><p className="eyebrow">History</p><h2>Logged days</h2></div>
        {logs.length === 0 && <article className="form-card"><p>No daily records yet.</p></article>}
        {logs.map((log) => (
          <article className="form-card tf-ai-output" key={log.date}>
            <div className="tf-ai-result-heading">
              <div><strong>{log.date}</strong><p>{log.shiftMode === "night" ? "Night shift" : "Day shift"}</p></div>
              <span>{log.completed ? "Complete" : "In progress"}</span>
            </div>
            <p><b>Nutrition:</b> {log.summaries.nutrition.count} meals · {Math.round(log.summaries.nutrition.calories)} cal · {Math.round(log.summaries.nutrition.proteinG)}g protein</p>
            <p><b>Training:</b> {log.summaries.training.count} workouts · {Math.round(log.summaries.training.completedSets)} sets</p>
            <p><b>Cardio:</b> {log.summaries.cardio.count} sessions · {Math.round(log.summaries.cardio.minutes)} min · {Number(log.summaries.cardio.distanceKm).toFixed(1)}km</p>
          </article>
        ))}
      </section>
    </main>
  );
}

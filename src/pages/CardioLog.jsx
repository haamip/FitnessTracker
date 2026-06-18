import { useEffect, useMemo, useState } from "react";

const defaultForm = {
  type: "Walk",
  duration: "",
  distance: "",
  calories: "",
  notes: "",
};

function CardioLog() {
  const [form, setForm] = useState(defaultForm);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    setSessions(JSON.parse(localStorage.getItem("trackfit_cardio") || "[]"));
  }, []);

  const chartData = useMemo(() => {
    return [...sessions]
      .slice(0, 7)
      .reverse()
      .map((s) => ({
        label: new Date(s.date).toLocaleDateString("en-NZ", { day: "2-digit", month: "short" }),
        duration: Number(s.duration) || 0,
      }));
  }, [sessions]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function saveSession(e) {
    e.preventDefault();

    if (!form.duration && !form.distance && !form.calories) {
      alert("Add at least duration, distance, or calories.");
      return;
    }

    const entry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      ...form,
    };

    const next = [entry, ...sessions];
    localStorage.setItem("trackfit_cardio", JSON.stringify(next));
    setSessions(next);
    setForm(defaultForm);
  }

  const maxDuration = Math.max(...chartData.map((d) => d.duration), 1);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Cardio Log</h1>
          <p>Track walks, runs, bikes, rower, stairmaster, and conditioning.</p>
        </div>
      </div>

      <section className="panel">
        <form onSubmit={saveSession} className="form-grid">
          <label>Type
            <select value={form.type} onChange={(e) => updateField("type", e.target.value)}>
              <option>Walk</option>
              <option>Run</option>
              <option>Bike</option>
              <option>Rower</option>
              <option>Stairmaster</option>
              <option>Other</option>
            </select>
          </label>

          <label>Duration minutes
            <input type="number" value={form.duration} onChange={(e) => updateField("duration", e.target.value)} />
          </label>

          <label>Distance km
            <input type="number" step="0.01" value={form.distance} onChange={(e) => updateField("distance", e.target.value)} />
          </label>

          <label>Calories
            <input type="number" value={form.calories} onChange={(e) => updateField("calories", e.target.value)} />
          </label>

          <label className="full-width">Notes
            <textarea value={form.notes} onChange={(e) => updateField("notes", e.target.value)} />
          </label>

          <button className="primary-btn" type="submit">Save Cardio</button>
        </form>
      </section>

      <section className="panel">
        <h2>Cardio Graph</h2>

        {chartData.length === 0 ? (
          <p className="muted">No cardio logged yet.</p>
        ) : (
          <div className="cardio-chart">
            {chartData.map((item) => (
              <div className="bar-wrap" key={item.label}>
                <div className="bar" style={{ height: `${(item.duration / maxDuration) * 160}px` }}>
                  <span>{item.duration}m</span>
                </div>
                <small>{item.label}</small>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Recent Cardio</h2>

        {sessions.length === 0 ? (
          <p className="muted">No cardio logged yet.</p>
        ) : (
          <div className="card-list">
            {sessions.map((item) => (
              <div className="log-card" key={item.id}>
                <div>
                  <strong>{item.type}</strong>
                  <p>{new Date(item.date).toLocaleDateString()}</p>
                </div>
                <div>{item.duration || "-"} min</div>
                <div>{item.distance || "-"} km</div>
                <div>{item.calories || "-"} cal</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default CardioLog;

/*
|--------------------------------------------------------------------------
| DailyCheckIn.jsx
|--------------------------------------------------------------------------
| Daily user tracking page.
|
| Responsibilities:
| - Record weight
| - Record calories
| - Record protein intake
| - Record water intake
| - Record sleep
| - Record mood
| - Record training status
|
| Saves data to:
| trackfit_checkins
|--------------------------------------------------------------------------
*/
import { useState } from "react";

const defaultForm = {
  weight: "102.9",
  calories: "2500",
  protein: "220",
  water: "5",
  steps: "10000",
  sleep: "7",
  mood: "Good",
  trained: false,
};

function DailyCheckIn() {
  const [form, setForm] = useState(defaultForm);
  const [saved, setSaved] = useState(() =>
    JSON.parse(localStorage.getItem("trackfit_checkins") || "[]")
  );

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function saveCheckIn(e) {
    e.preventDefault();

    const entry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      weight: form.weight,
      calories: form.calories,
      protein: form.protein,
      water: form.water,
      steps: form.steps,
      sleep: form.sleep,
      mood: form.mood,
      trained: form.trained,
    };

    const next = [entry, ...saved];
    localStorage.setItem("trackfit_checkins", JSON.stringify(next));
    setSaved(next);

    alert("Check-in saved");
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Daily Check-In</h1>
          <p>Track the basics that actually move the needle.</p>
        </div>
      </div>

      <section className="panel">
        <form onSubmit={saveCheckIn} className="form-grid">
          <label>Weight
            <input type="number" step="0.1" value={form.weight} onChange={(e) => updateField("weight", e.target.value)} />
          </label>

          <label>Calories
            <input type="number" value={form.calories} onChange={(e) => updateField("calories", e.target.value)} />
          </label>

          <label>Protein
            <input type="number" value={form.protein} onChange={(e) => updateField("protein", e.target.value)} />
          </label>

          <label>Water
            <input type="number" step="0.1" value={form.water} onChange={(e) => updateField("water", e.target.value)} />
          </label>

          <label>Steps
            <input type="number" value={form.steps} onChange={(e) => updateField("steps", e.target.value)} />
          </label>

          <label>Sleep hours
            <input type="number" step="0.5" value={form.sleep} onChange={(e) => updateField("sleep", e.target.value)} />
          </label>

          <label>Mood
            <select value={form.mood} onChange={(e) => updateField("mood", e.target.value)}>
              <option>Great</option>
              <option>Good</option>
              <option>Average</option>
              <option>Flat</option>
              <option>Wrecked</option>
            </select>
          </label>

          <label className="checkbox-row">
            <input type="checkbox" checked={form.trained} onChange={(e) => updateField("trained", e.target.checked)} />
            Trained today
          </label>

          <button className="primary-btn" type="submit">Save Check-In</button>
        </form>
      </section>

      <section className="panel">
        <h2>Recent Check-Ins</h2>

        {saved.length === 0 ? (
          <p className="muted">No check-ins yet.</p>
        ) : (
          <div className="checkin-list">
            {saved.slice(0, 7).map((item) => (
              <div className="checkin-card" key={item.id}>
                <strong>{new Date(item.date).toLocaleDateString()}</strong>
                <span>{item.weight || "-"}kg</span>
                <span>{item.protein || "-"}g protein</span>
                <span>{item.water || "-"}L water</span>
                <span>{item.sleep || "-"}h sleep</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default DailyCheckIn;




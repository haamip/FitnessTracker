/*
|--------------------------------------------------------------------------
| Dashboard.jsx
|--------------------------------------------------------------------------
| Main fitness dashboard.
|
| Responsibilities:
| - Loads check-in data from localStorage
| - Loads cardio data from localStorage
| - Calculates weight loss progress
| - Calculates weekly averages
| - Displays dashboard summary cards
|
| Data Sources:
| trackfit_checkins
| trackfit_cardio
|--------------------------------------------------------------------------
*/
import { useMemo, useState } from "react";

const START_WEIGHT = 114;
const GOAL_WEIGHT = 95;

function Dashboard() {
  const [checkins] = useState(() =>
    JSON.parse(localStorage.getItem("trackfit_checkins") || "[]")
  );

  const [cardio] = useState(() =>
    JSON.parse(localStorage.getItem("trackfit_cardio") || "[]")
  );

  const [today] = useState(() => Date.now());

  const stats = useMemo(() => {
    const latest = checkins[0] || {};
    const currentWeight = Number(latest.weight) || START_WEIGHT;
    const lost = START_WEIGHT - currentWeight;
    const remaining = currentWeight - GOAL_WEIGHT;

    const last7 = checkins.slice(0, 7);

    const avg = (key) => {
      if (last7.length === 0) return 0;
      const total = last7.reduce((sum, item) => sum + (Number(item[key]) || 0), 0);
      return total / last7.length;
    };

    const thisWeekCardio = cardio.filter((s) => {
      const daysAgo = (today - new Date(s.date).getTime()) / 86400000;
      return daysAgo <= 7;
    });

    return {
      currentWeight,
      lost,
      remaining,
      proteinToday: latest.protein || "-",
      waterToday: latest.water || "-",
      sleepToday: latest.sleep || "-",
      trainedToday: latest.trained ? "Yes" : "No",
      avgProtein: avg("protein"),
      avgWater: avg("water"),
      avgSleep: avg("sleep"),
      cardioSessions: thisWeekCardio.length,
      cardioMinutes: thisWeekCardio.reduce((sum, s) => sum + (Number(s.duration) || 0), 0),
      cardioDistance: thisWeekCardio.reduce((sum, s) => sum + (Number(s.distance) || 0), 0),
    };
  }, [checkins, cardio, today]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Your cut, training, and progress at a glance.</p>
        </div>
      </div>

      <section className="stats-grid">
        <div className="stat-card">
          <span>Current Weight</span>
          <strong>{stats.currentWeight.toFixed(1)}kg</strong>
        </div>

        <div className="stat-card">
          <span>Total Lost</span>
          <strong>{stats.lost.toFixed(1)}kg</strong>
        </div>

        <div className="stat-card">
          <span>Goal Weight</span>
          <strong>{GOAL_WEIGHT}kg</strong>
        </div>

        <div className="stat-card">
          <span>Remaining</span>
          <strong>{stats.remaining.toFixed(1)}kg</strong>
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <span>Protein Today</span>
          <strong>{stats.proteinToday}g</strong>
        </div>

        <div className="stat-card">
          <span>Water Today</span>
          <strong>{stats.waterToday}L</strong>
        </div>

        <div className="stat-card">
          <span>Sleep</span>
          <strong>{stats.sleepToday}h</strong>
        </div>

        <div className="stat-card">
          <span>Trained Today</span>
          <strong>{stats.trainedToday}</strong>
        </div>
      </section>

      <section className="panel">
        <h2>7 Day Averages</h2>

        <div className="stats-grid">
          <div className="stat-card">
            <span>Protein Avg</span>
            <strong>{stats.avgProtein.toFixed(0)}g</strong>
          </div>

          <div className="stat-card">
            <span>Water Avg</span>
            <strong>{stats.avgWater.toFixed(1)}L</strong>
          </div>

          <div className="stat-card">
            <span>Sleep Avg</span>
            <strong>{stats.avgSleep.toFixed(1)}h</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Cardio This Week</h2>

        <div className="stats-grid">
          <div className="stat-card">
            <span>Sessions</span>
            <strong>{stats.cardioSessions}</strong>
          </div>

          <div className="stat-card">
            <span>Total Minutes</span>
            <strong>{stats.cardioMinutes}m</strong>
          </div>

          <div className="stat-card">
            <span>Total Distance</span>
            <strong>{stats.cardioDistance.toFixed(1)}km</strong>
          </div>
        </div>
      </section>
    </>
  );
}

export default Dashboard;






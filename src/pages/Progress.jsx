/*
|--------------------------------------------------------------------------
| Progress.jsx
|--------------------------------------------------------------------------
| Progress tracking page.
|
| Future Features:
| - Weight graph
| - Cardio graph
| - Workout graph
| - Progress photos
| - Goal tracking
|
| Purpose:
| Visualise long-term progress trends.
|--------------------------------------------------------------------------
*/
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function Progress() {
  const [checkins, setCheckins] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("trackfit_checkins") || "[]");
    setCheckins(saved);
  }, []);

  const chartData = [...checkins]
    .filter((item) => item.weight)
    .reverse()
    .map((item) => ({
      date: new Date(item.date).toLocaleDateString(),
      weight: Number(item.weight),
    }));

  const startWeight = chartData[0]?.weight || 105;
  const currentWeight = chartData[chartData.length - 1]?.weight || startWeight;
  const totalLost = (startWeight - currentWeight).toFixed(1);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Progress</h1>
          <p>Watch the trend, not the daily noise.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <p>Starting Weight</p>
          <h2>{startWeight}kg</h2>
        </div>
        <div className="stat-card">
          <p>Current Weight</p>
          <h2>{currentWeight}kg</h2>
        </div>
        <div className="stat-card">
          <p>Total Lost</p>
          <h2>{totalLost}kg</h2>
        </div>
      </div>

      <section className="panel">
        <h2>Weight Trend</h2>

        {chartData.length < 2 ? (
          <p className="muted">Add at least two check-ins to show your graph.</p>
        ) : (
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={["dataMin - 1", "dataMax + 1"]} />
                <Tooltip />
                <Line type="monotone" dataKey="weight" strokeWidth={3} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </>
  );
}

export default Progress;


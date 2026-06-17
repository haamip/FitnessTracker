import StatCard from "../components/StatCard";

function Dashboard() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Track the plan, not the excuses.</p>
        </div>
        <button className="primary-btn">Daily Check-In</button>
      </div>

      <div className="stats-grid">
        <StatCard label="Current Weight" value="105kg" note="Starting point" />
        <StatCard label="Goal Weight" value="95kg" note="10kg to target" />
        <StatCard label="Today’s Score" value="4 / 7" note="Tasks completed" />
        <StatCard label="Current Streak" value="3 days" note="Keep rolling" />
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <h2>Today’s Tasks</h2>
          <div className="task-list">
            <label><input type="checkbox" /> Workout completed</label>
            <label><input type="checkbox" /> Protein target hit</label>
            <label><input type="checkbox" /> Water target hit</label>
            <label><input type="checkbox" /> Daily check-in completed</label>
          </div>
        </section>

        <section className="panel">
          <h2>Active Plan</h2>
          <p className="big-text">12 Week Cut</p>
          <p className="muted">2600 kcal · 185g protein · 3L water · 5 training days</p>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
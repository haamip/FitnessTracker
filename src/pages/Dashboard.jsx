function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>

      <div className="card-grid">
        <div className="card">
          <h3>Current Weight</h3>
          <p>105kg</p>
        </div>

        <div className="card">
          <h3>Goal Weight</h3>
          <p>95kg</p>
        </div>

        <div className="card">
          <h3>Current Streak</h3>
          <p>3 Days</p>
        </div>

        <div className="card">
          <h3>Consistency</h3>
          <p>85%</p>
        </div>
      </div>

      <div className="panel">
        <h2>Today's Tasks</h2>

        <label><input type="checkbox" /> Workout Complete</label>
        <label><input type="checkbox" /> Protein Target Hit</label>
        <label><input type="checkbox" /> Water Target Hit</label>
        <label><input type="checkbox" /> Daily Check-In Complete</label>
      </div>
    </div>
  );
}

export default Dashboard;
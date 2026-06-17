function Progress() {
  return (
    <div>
      <h1>Progress</h1>

      <div className="card-grid">

        <div className="card">
          <h3>Starting Weight</h3>
          <p>114kg</p>
        </div>

        <div className="card">
          <h3>Current Weight</h3>
          <p>105kg</p>
        </div>

        <div className="card">
          <h3>Total Lost</h3>
          <p>9kg</p>
        </div>

      </div>

      <div className="panel">
        <h2>Weight Trend</h2>
        <p>Chart goes here later</p>
      </div>
    </div>
  );
}

export default Progress;
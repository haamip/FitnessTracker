function PlanSetup() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Plan</h1>
          <p>Set the targets from whatever plan you already have.</p>
        </div>
      </div>

      <section className="panel form-panel">
        <label>Plan Name</label>
        <input placeholder="12 Week Cut" />

        <label>Goal Weight</label>
        <input type="number" placeholder="95" />

        <label>Daily Calories</label>
        <input type="number" placeholder="2600" />

        <label>Protein Target</label>
        <input type="number" placeholder="185" />

        <label>Water Target</label>
        <input type="number" placeholder="3" />

        <label>Training Days Per Week</label>
        <input type="number" placeholder="5" />

        <button className="primary-btn">Save Plan</button>
      </section>
    </div>
  );
}

export default PlanSetup;
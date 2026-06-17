function PlanSetup() {
  return (
    <div>
      <h1>My Plan</h1>

      <div className="panel">
        <label>Goal Weight</label>
        <input type="number" placeholder="95" />

        <label>Protein Target</label>
        <input type="number" placeholder="185" />

        <label>Water Target (L)</label>
        <input type="number" placeholder="3" />

        <label>Training Days</label>
        <input type="number" placeholder="5" />

        <button>Save Plan</button>
      </div>
    </div>
  );
}

export default PlanSetup;
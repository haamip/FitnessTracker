function CheckIn() {
  return (
    <div>
      <h1>Daily Check-In</h1>

      <div className="panel">

        <label>Weight</label>
        <input type="number" />

        <label>Protein</label>
        <input type="number" />

        <label>Water (L)</label>
        <input type="number" />

        <label>Calories</label>
        <input type="number" />

        <label>Mood</label>
        <select>
          <option>Great</option>
          <option>Good</option>
          <option>Average</option>
          <option>Poor</option>
        </select>

        <button>Submit Check-In</button>

      </div>
    </div>
  );
}

export default CheckIn;
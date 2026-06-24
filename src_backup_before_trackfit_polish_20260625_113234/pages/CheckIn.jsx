function CheckIn() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Daily Check-In</h1>
          <p>Small daily inputs. Big long-term proof.</p>
        </div>
      </div>

      <section className="panel form-panel">
        <label>Weight</label>
        <input type="number" placeholder="105" />

        <label>Protein</label>
        <input type="number" placeholder="185" />

        <label>Water</label>
        <input type="number" placeholder="3" />

        <label>Calories</label>
        <input type="number" placeholder="2600" />

        <label>Mood</label>
        <select>
          <option>Great</option>
          <option>Good</option>
          <option>Average</option>
          <option>Poor</option>
        </select>

        <button className="primary-btn">Submit Check-In</button>
      </section>
    </div>
  );
}

export default CheckIn;

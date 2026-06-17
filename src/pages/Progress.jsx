import StatCard from "../components/StatCard";

function Progress() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Progress</h1>
          <p>Evidence beats motivation.</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Starting Weight" value="114kg" note="Original baseline" />
        <StatCard label="Current Weight" value="105kg" note="Latest check-in" />
        <StatCard label="Total Lost" value="9kg" note="Solid shift" />
        <StatCard label="Consistency" value="85%" note="This week" />
      </div>

      <section className="panel">
        <h2>Weight Trend</h2>
        <div className="placeholder-chart">Chart coming next</div>
      </section>
    </div>
  );
}

export default Progress;
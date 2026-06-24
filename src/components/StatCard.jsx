function StatCard({ label, value, note }) {
  return (
    <div className="stat-card">
      <p>{label}</p>
      <h3>{value}</h3>
      <span>{note}</span>
    </div>
  );
}

export default StatCard;


export default function ProgressRing({ value = 0, label = "Complete" }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="progress-ring" style={{ "--progress": `${safeValue}%` }}>
      <div>
        <strong>{safeValue}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
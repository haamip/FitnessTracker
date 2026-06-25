export default function ProgressBar({ value = 0, dark = false }) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className={dark ? "progress-line progress-line-dark" : "progress-line"}>
      <span style={{ width: `${safeValue}%` }}></span>
    </div>
  );
}
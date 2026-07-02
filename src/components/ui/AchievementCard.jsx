export default function AchievementCard({ emoji, title, detail }) {
  return (
    <div className="achievement-card">
      <span>{emoji}</span>
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
    </div>
  );
}

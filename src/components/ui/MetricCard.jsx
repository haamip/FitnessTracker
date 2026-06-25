import Card from "./Card";

export default function MetricCard({ icon: Icon, value, label }) {
  return (
    <Card className="metric-card">
      {Icon && <Icon />}
      <strong>{value}</strong>
      <span>{label}</span>
    </Card>
  );
}
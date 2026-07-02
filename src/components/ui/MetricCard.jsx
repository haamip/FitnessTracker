import Card from "./Card";

export default function MetricCard({ icon: Icon, value, label, tone = "" }) {
  return (
    <Card className={`metric-card ${tone}`.trim()}>
      {Icon && <Icon />}
      <strong>{value}</strong>
      <span>{label}</span>
    </Card>
  );
}

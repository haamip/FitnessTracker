import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function LineChartCard({ title, data, dataKey, unit = "" }) {
  return (
    <section className="chart-card">
      <div className="chart-card__header">
        <p className="eyebrow">Progress</p>
        <h3>{title}</h3>
      </div>

      <div className="chart-card__body">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(15, 23, 42, 0.08)" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(value) => [`${value}${unit}`, title]} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="var(--gold)"
              strokeWidth={4}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
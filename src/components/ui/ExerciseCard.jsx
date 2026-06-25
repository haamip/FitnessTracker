import { Trophy } from "lucide-react";

export default function ExerciseCard({ name, target, sets = [] }) {
  return (
    <section className="exercise-card">
      <div className="exercise-card-head">
        <div>
          <h3>{name}</h3>
          <p>{target}</p>
        </div>
        <Trophy size={18} />
      </div>

      <div className="set-grid">
        {sets.map((set, index) => (
          <button className={index === 0 ? "set-pill done" : "set-pill"} key={set}>
            {index === 0 ? "✓ " : ""}{set}
          </button>
        ))}
      </div>
    </section>
  );
}
import { Link } from "react-router-dom";
import { ChevronRight, Flame } from "lucide-react";
import StatPill from "./StatPill";

export default function WorkoutCard({ to, name, detail, tag, time }) {
  return (
    <Link className="list-card workout-link" to={to}>
      <div className="list-card-main">
        <div className="icon-bubble">
          <Flame />
        </div>
        <div>
          <h3>{name}</h3>
          <p>
            {detail} Ã‚Â· {time}
          </p>
        </div>
      </div>
      <div className="list-card-end">
        <StatPill>{tag}</StatPill>
        <ChevronRight size={18} />
      </div>
    </Link>
  );
}

import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Dumbbell,
  TrendingUp,
  HeartPulse,
  CheckSquare,
  Brain,
} from "lucide-react";
import "./BottomNav.css";

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <NavLink to="/" end>
        <LayoutDashboard size={20} />
        <span>Home</span>
      </NavLink>

      <NavLink to="/workouts">
        <Dumbbell size={20} />
        <span>Train</span>
      </NavLink>

      <NavLink to="/progress">
        <TrendingUp size={20} />
        <span>Progress</span>
      </NavLink>

      <NavLink to="/coach">
        <Brain size={20} />
        <span>Coach</span>
      </NavLink>

      <NavLink to="/cardio">
        <HeartPulse size={20} />
        <span>Cardio</span>
      </NavLink>

      <NavLink to="/checkin">
        <CheckSquare size={20} />
        <span>Check</span>
      </NavLink>
    </nav>
  );
}

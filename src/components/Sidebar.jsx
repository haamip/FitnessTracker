import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  CheckSquare,
  TrendingUp,
  Dumbbell,
  HeartPulse,
} from "lucide-react";

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo">TF</div>
        <div>
          <h2>TrackFit</h2>
          <p>Bring your own plan</p>
        </div>
      </div>

      <nav className="nav">
        <NavLink to="/">
          <LayoutDashboard size={18} /> Dashboard
        </NavLink>
        <NavLink to="/plan">
          <ClipboardList size={18} /> My Plan
        </NavLink>
        <NavLink to="/checkin">
          <CheckSquare size={18} /> Check-In
        </NavLink>
        <NavLink to="/cardio">
          <HeartPulse size={18} /> Cardio
        </NavLink>
        <NavLink to="/progress">
          <TrendingUp size={18} /> Progress
        </NavLink>
        <NavLink to="/workouts">
          <Dumbbell size={18} /> Workouts
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;

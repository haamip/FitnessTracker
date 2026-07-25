/*
 * TRACKFIT COMPONENT
 *
 * Purpose:
 * Main bottom navigation for the mobile app shell.
 */

import { NavLink } from "react-router-dom";
import {
  Activity,
  Brain,
  Dumbbell,
  TrendingUp,
  Utensils,
} from "lucide-react";
import "./BottomNav.css";

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <NavLink to="/" end>
        <Brain size={20} />
        <span>Coach</span>
      </NavLink>

      <NavLink to="/workouts">
        <Dumbbell size={20} />
        <span>Train</span>
      </NavLink>

      <NavLink to="/cardio">
        <Activity size={20} />
        <span>Cardio</span>
      </NavLink>

      <NavLink to="/nutrition">
        <Utensils size={20} />
        <span>Food</span>
      </NavLink>

      <NavLink to="/progress">
        <TrendingUp size={20} />
        <span>Progress</span>
      </NavLink>
    </nav>
  );
}

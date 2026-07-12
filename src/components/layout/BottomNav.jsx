/*
 * TRACKFIT COMPONENT
 *
 * Purpose:
 * Main bottom navigation for the mobile app shell.
 *
 * Product direction:
 * Keep the visible app simple. Coach is the home screen while cardio,
 * check-in, builders, and deeper tools remain available through the pages
 * that need them rather than competing for permanent navigation space.
 */

import { NavLink } from "react-router-dom";
import { Brain, Dumbbell, TrendingUp, Utensils } from "lucide-react";
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

/*
 * TRACKFIT COMPONENT
 *
 * Purpose:
 * Main bottom navigation for the mobile app shell.
 *
 * Data:
 * Uses React Router links only.
 *
 * Features:
 * - Home
 * - Train
 * - Move
 * - Food
 * - Coach
 * - Check-in
 *
 * Future:
 * Consider a More page if the navigation grows beyond MVP.
 */

import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Dumbbell,
  HeartPulse,
  CheckSquare,
  Brain,
  Utensils,
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

      <NavLink to="/cardio">
        <HeartPulse size={20} />
        <span>Move</span>
      </NavLink>

      <NavLink to="/nutrition">
        <Utensils size={20} />
        <span>Food</span>
      </NavLink>

      <NavLink to="/coach">
        <Brain size={20} />
        <span>Coach</span>
      </NavLink>

      <NavLink to="/checkin">
        <CheckSquare size={20} />
        <span>Check</span>
      </NavLink>
    </nav>
  );
}

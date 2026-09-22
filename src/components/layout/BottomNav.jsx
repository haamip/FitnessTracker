import { NavLink, useLocation } from "react-router-dom";
import { Activity, Dumbbell, House, TrendingUp, Utensils } from "lucide-react";
import "./BottomNav.css";

const destinations = [
  { to: "/", label: "Home", icon: House, matches: ["/", "/dashboard", "/coach", "/coach/intelligence"] },
  { to: "/workouts", label: "Train", icon: Dumbbell, matches: ["/workouts", "/exercises", "/plan"] },
  { to: "/cardio", label: "Cardio", icon: Activity, matches: ["/cardio"] },
  { to: "/nutrition", label: "Food", icon: Utensils, matches: ["/nutrition"] },
  { to: "/progress", label: "Progress", icon: TrendingUp, matches: ["/progress"] },
];

export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {destinations.map(({ to, label, icon: Icon, matches }) => {
        const selected = matches.some((path) => pathname === path || (path !== "/" && pathname.startsWith(`${path}/`)));
        return (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={selected ? "tf-nav-link tf-nav-link--active" : "tf-nav-link"}
            aria-current={selected ? "page" : undefined}
          >
            <Icon size={21} strokeWidth={selected ? 2.4 : 1.9} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

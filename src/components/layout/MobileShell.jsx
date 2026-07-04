import { useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import logo from "../../assets/brand/trackfit-logo.png";
import "./MobileShell.css";

/**
 * MobileShell
 *
 * Main phone-frame layout used across TrackFit.
 * Keeps the top brand bar, routed page content, and bottom navigation consistent.
 *
 * Developer routes use a wider internal dashboard layout because they are for
 * inspecting app data rather than testing the phone UI.
 */
export default function MobileShell({ children }) {
  const location = useLocation();
  const isDeveloperTools = location.pathname.startsWith("/dev-tools");

  return (
    <div
      className={isDeveloperTools ? "mobile-frame dev-frame" : "mobile-frame"}
    >
      <header className="app-topbar">
        <img src={logo} alt="TrackFit" className="topbar-logo" />
        <div>
          <strong>TrackFit</strong>
          <span>
            {isDeveloperTools ? "Developer cockpit" : "Built to move"}
          </span>
        </div>
      </header>

      <main className="mobile-content">{children}</main>

      {!isDeveloperTools && <BottomNav />}
    </div>
  );
}

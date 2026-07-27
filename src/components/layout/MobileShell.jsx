import { useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import AccountMenu from "./AccountMenu";
import ShiftModeToggle from "./ShiftModeToggle";
import logo from "../../assets/brand/trackfit-logo.png";
import "./MobileShell.css";

/**
 * Main phone-frame layout used across TrackFit.
 * The shift switch is global so nutrition dates, AI context and coaching all use
 * the same day-shift or night-shift interpretation.
 */
export default function MobileShell({ children }) {
  const location = useLocation();
  const isDeveloperTools = location.pathname.startsWith("/dev-tools");

  return (
    <div className={isDeveloperTools ? "mobile-frame dev-frame" : "mobile-frame"}>
      <header className="app-topbar">
        <img src={logo} alt="TrackFit" className="topbar-logo" />
        <div>
          <strong>TrackFit</strong>
          <span>{isDeveloperTools ? "Developer cockpit" : "Built to move"}</span>
        </div>
        {!isDeveloperTools && (
          <div className="app-topbar-actions">
            <ShiftModeToggle />
            <AccountMenu />
          </div>
        )}
      </header>
      <main className="mobile-content">{children}</main>
      {!isDeveloperTools && <BottomNav />}
    </div>
  );
}

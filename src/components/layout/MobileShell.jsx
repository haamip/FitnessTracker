import { Link, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import AccountMenu from "./AccountMenu";
import ShiftModeToggle from "./ShiftModeToggle";
import "./MobileShell.css";

export default function MobileShell({ children }) {
  const { pathname } = useLocation();
  const isDeveloperTools = pathname.startsWith("/dev-tools");

  return (
    <div className={isDeveloperTools ? "mobile-frame tf-shell dev-frame" : "mobile-frame tf-shell"}>
      <a className="tf-skip-link" href="#trackfit-main">Skip to content</a>
      <header className="app-topbar tf-topbar">
        <Link className="tf-brand" to="/" aria-label="TrackFit home">
          <span className="tf-brand-mark" aria-hidden="true">T<span>F</span></span>
          <span className="tf-brand-copy"><strong>TRACKFIT</strong><small>TRAINING, SIMPLIFIED.</small></span>
        </Link>
        {!isDeveloperTools && (
          <div className="app-topbar-actions">
            <ShiftModeToggle />
            <AccountMenu />
          </div>
        )}
      </header>
      <main className="mobile-content" id="trackfit-main">{children}</main>
      {!isDeveloperTools && <BottomNav />}
    </div>
  );
}

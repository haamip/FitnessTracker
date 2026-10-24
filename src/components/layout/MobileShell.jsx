import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { syncWatchOnForeground } from "../../services/watchAutoSync";
import { isTrackFitNativeApp } from "../../services/watchConnectionStatus";
import BottomNav from "./BottomNav";
import AccountMenu from "./AccountMenu";
import ShiftModeToggle from "./ShiftModeToggle";
import "./MobileShell.css";
import "./NativeShell.css";

export default function MobileShell({ children }) {
  const { pathname } = useLocation();
  const isDeveloperTools = pathname.startsWith("/dev-tools");
  const native = isTrackFitNativeApp();

  useEffect(() => {
    const attempt = () => { if (!document.hidden) void syncWatchOnForeground(); };
    // Read previously authorised steps on app opening or returning to foreground.
    attempt();
    window.addEventListener("focus", attempt);
    document.addEventListener("visibilitychange", attempt);
    return () => {
      window.removeEventListener("focus", attempt);
      document.removeEventListener("visibilitychange", attempt);
    };
  }, []);

  return (
    <div className={isDeveloperTools ? "mobile-frame tf-shell dev-frame" : native ? "mobile-frame tf-shell tf-native-shell" : "mobile-frame tf-shell"}>
      <a className="tf-skip-link" href="#trackfit-main">Skip to content</a>
      <header className="app-topbar tf-topbar">
        <Link className="tf-brand" to="/" aria-label="TrackFit home">
          <span className="tf-brand-mark" aria-hidden="true">TF</span>
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

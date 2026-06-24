import BottomNav from "./BottomNav";
import logo from "../../assets/brand/trackfit-logo.png";
import "./MobileShell.css";

export default function MobileShell({ children }) {
  return (
    <div className="mobile-frame">
      <header className="app-topbar">
        <img src={logo} alt="TrackFit" className="topbar-logo" />
        <div>
          <strong>TrackFit</strong>
          <span>Built to move</span>
        </div>
      </header>

      <main className="mobile-content">{children}</main>

      <BottomNav />
    </div>
  );
}

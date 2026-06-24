import logo from "../assets/brand/trackfit-logo.png";
import "./Splash.css";

export default function Splash() {
  return (
    <section className="splash-screen">
      <img src={logo} alt="TrackFit" className="splash-logo" />
      <h1>TrackFit</h1>
      <p>Train hard. Track simple.</p>
    </section>
  );
}


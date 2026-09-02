import {
  Activity,
  ArrowRight,
  BrainCircuit,
  Check,
  Dumbbell,
  Gauge,
  MoonStar,
  ShieldCheck,
  Sparkles,
  Utensils,
  WifiOff,
} from "lucide-react";
import trackFitLogo from "../../assets/brand/trackfit-logo.png";
import "./TrackFitLanding.css";

const features = [
  {
    icon: BrainCircuit,
    title: "Coaching, not just logging",
    text: "TrackFit turns workouts, recovery, nutrition and adherence into a clear next move — then explains why.",
  },
  {
    icon: Dumbbell,
    title: "Training that remembers",
    text: "Previous sets, progression targets, PRs, estimated strength and exercise history stay connected to every session.",
  },
  {
    icon: Gauge,
    title: "Readiness with context",
    text: "Daily check-ins and recent training load help TrackFit decide whether today is a push day, hold day or recovery day.",
  },
  {
    icon: Utensils,
    title: "Food without the admin",
    text: "Track calories and protein, paste meals quickly, scan food and keep nutrition connected to the training decision.",
  },
  {
    icon: MoonStar,
    title: "Built for real schedules",
    text: "Day shift, night shift and changing routines are treated as part of the plan instead of an inconvenience.",
  },
  {
    icon: WifiOff,
    title: "Useful when signal isn't",
    text: "TrackFit keeps a local-first workflow so your session is still yours when the network drops out.",
  },
];

const signals = [
  ["Training", "Recent sessions, volume, progression"],
  ["Recovery", "Sleep, soreness, energy, body feel"],
  ["Nutrition", "Calories, protein, consistency"],
  ["Movement", "Cardio, steps, weekly activity"],
];

export default function TrackFitLanding({ onEnter }) {
  return (
    <main className="tf-site">
      <div className="tf-site__glow tf-site__glow--one" />
      <div className="tf-site__glow tf-site__glow--two" />

      <nav className="tf-site__nav" aria-label="TrackFit website">
        <a className="tf-site__brand" href="#top" aria-label="TrackFit home">
          <img src={trackFitLogo} alt="" />
          <span>
            <strong>TrackFit</strong>
            <small>by HAKT Industries</small>
          </span>
        </a>

        <div className="tf-site__navlinks">
          <a href="#why">Why TrackFit</a>
          <a href="#coach">Intelligence</a>
          <button type="button" className="tf-button tf-button--ghost" onClick={onEnter}>
            Sign in
          </button>
        </div>
      </nav>

      <section className="tf-hero" id="top">
        <div className="tf-hero__copy">
          <div className="tf-kicker"><Sparkles size={15} /> Personal training intelligence</div>
          <h1>
            Train with a plan.
            <span>Adjust with intelligence.</span>
          </h1>
          <p className="tf-hero__lead">
            TrackFit connects your training, recovery, nutrition and daily habits so the app can help answer the question that matters most: <strong>what should I do next?</strong>
          </p>

          <div className="tf-hero__actions">
            <button type="button" className="tf-button tf-button--primary" onClick={onEnter}>
              Open TrackFit <ArrowRight size={18} />
            </button>
            <a className="tf-button tf-button--quiet" href="#why">See how it works</a>
          </div>

          <div className="tf-hero__trust">
            <span><Check size={15} /> Workout intelligence</span>
            <span><Check size={15} /> Cloud sync</span>
            <span><Check size={15} /> Local fallback</span>
          </div>
        </div>

        <div className="tf-preview" aria-label="TrackFit coaching preview">
          <div className="tf-preview__topline">
            <div>
              <span className="tf-preview__eyebrow">TODAY</span>
              <h2>Coach brief</h2>
            </div>
            <div className="tf-preview__mark"><Activity size={21} /></div>
          </div>

          <div className="tf-readiness">
            <div className="tf-readiness__ring">
              <span>82</span>
              <small>READY</small>
            </div>
            <div>
              <span className="tf-soft-label">Training decision</span>
              <h3>Push, but stay clean.</h3>
              <p>Recovery supports the planned session. Progress load only while reps stay controlled.</p>
            </div>
          </div>

          <div className="tf-preview__metrics">
            <div><span>Protein</span><strong>168g</strong><small>185g target</small></div>
            <div><span>Sessions</span><strong>4</strong><small>last 7 days</small></div>
            <div><span>Sleep</span><strong>7.2h</strong><small>weekly avg</small></div>
          </div>

          <div className="tf-preview__next">
            <span className="tf-soft-label">NEXT MOVE</span>
            <strong>Upper body strength</strong>
            <p>Keep the main lifts. Add load only if the final working set stays under RPE 9.</p>
          </div>
        </div>
      </section>

      <section className="tf-strip" aria-label="TrackFit product statement">
        <p>Logging tells you what happened.</p>
        <strong>TrackFit helps decide what happens next.</strong>
      </section>

      <section className="tf-section" id="why">
        <div className="tf-section__heading">
          <span className="tf-kicker">THE DIFFERENCE</span>
          <h2>Everything talks to everything else.</h2>
          <p>A workout logger should not pretend the rest of your day never happened. TrackFit builds one coaching picture from the signals you already create.</p>
        </div>

        <div className="tf-feature-grid">
          {features.map(({ icon: Icon, title, text }) => (
            <article className="tf-feature-card" key={title}>
              <div className="tf-feature-card__icon"><Icon size={21} /></div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="tf-section tf-intelligence" id="coach">
        <div className="tf-intelligence__copy">
          <span className="tf-kicker"><BrainCircuit size={15} /> TRACKFIT INTELLIGENCE</span>
          <h2>The AI is the voice. TrackFit is the brain.</h2>
          <p>
            Your training decision is calculated from TrackFit's own data and coaching engines first. AI turns that decision into useful, natural language instead of inventing a plan from thin air.
          </p>
          <div className="tf-intelligence__points">
            <span><ShieldCheck size={18} /> Decisions stay grounded in your logged data.</span>
            <span><ShieldCheck size={18} /> Recommendations can explain the signals behind them.</span>
            <span><ShieldCheck size={18} /> Core coaching still works without a live AI response.</span>
          </div>
        </div>

        <div className="tf-signal-panel">
          <div className="tf-signal-panel__header">
            <span>INPUT SIGNALS</span>
            <span>TRACKFIT DECISION</span>
          </div>
          <div className="tf-signal-panel__body">
            <div className="tf-signal-list">
              {signals.map(([title, detail]) => (
                <div key={title}>
                  <strong>{title}</strong>
                  <span>{detail}</span>
                </div>
              ))}
            </div>
            <div className="tf-signal-arrow"><ArrowRight size={22} /></div>
            <div className="tf-decision-card">
              <span>READINESS 82%</span>
              <strong>Moderate-high training day</strong>
              <p>Progress the session. Keep technical quality as the limiter.</p>
              <small>Then AI explains the why.</small>
            </div>
          </div>
        </div>
      </section>

      <section className="tf-cta">
        <div>
          <span className="tf-kicker">TRACKFIT</span>
          <h2>Less guessing. Better training.</h2>
          <p>Start with the web app now. Your training history will be ready to move with you as TrackFit expands to native mobile.</p>
        </div>
        <button type="button" className="tf-button tf-button--primary" onClick={onEnter}>
          Sign in or create account <ArrowRight size={18} />
        </button>
      </section>

      <footer className="tf-footer">
        <span>TrackFit</span>
        <span>A HAKT Industries product.</span>
      </footer>
    </main>
  );
}

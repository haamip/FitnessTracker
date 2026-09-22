import { useState } from "react";
import { ArrowRight, Dumbbell, LockKeyhole, Mail } from "lucide-react";
import { supabase } from "../../services/supabase";
import "./AuthScreen.css";

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("signin");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const isSignup = mode === "signup";

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");

    try {
      const result = isSignup
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      setMessage(
        result.error
          ? result.error.message
          : isSignup
            ? "Account created. Check your email if confirmation is enabled."
            : "Signed in.",
      );
    } catch {
      setMessage("We couldn't connect right now. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  function toggleMode() {
    setMode(isSignup ? "signin" : "signup");
    setMessage("");
  }

  return (
    <main className="auth-layout">
      <section className="auth-story" aria-label="TrackFit introduction">
        <div className="auth-brand">
          <span className="auth-brand-mark" aria-hidden="true"><Dumbbell size={25} strokeWidth={2} /></span>
          <span>TRACKFIT</span>
        </div>
        <div className="auth-story-content">
          <span className="auth-overline">TRAIN WITH INTENT</span>
          <h1>Show up.<br /><em>Get stronger.</em></h1>
          <p>A clearer place for your training, recovery and nutrition. Focus on the next step and keep your progress moving.</p>
        </div>
        <span className="auth-story-foot">YOUR TRAINING. YOUR PACE.</span>
      </section>

      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-panel-inner">
          <span className="auth-panel-kicker">YOUR SPACE TO PROGRESS</span>
          <h2 id="auth-title">{isSignup ? "Start your journey." : "Welcome back."}</h2>
          <p className="auth-panel-description">
            {isSignup
              ? "Create an account to keep your training in one place."
              : "Pick up where you left off. Your next session is waiting."}
          </p>

          <form className="auth-form" onSubmit={submit}>
            <label htmlFor="trackfit-email">Email address</label>
            <div className="auth-field">
              <Mail size={19} aria-hidden="true" />
              <input
                id="trackfit-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <label htmlFor="trackfit-password">Password</label>
            <div className="auth-field">
              <LockKeyhole size={19} aria-hidden="true" />
              <input
                id="trackfit-password"
                type="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                placeholder="At least 6 characters"
                minLength={6}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            <button className="auth-submit" type="submit" disabled={busy}>
              <span>{busy ? "Please wait..." : isSignup ? "Create account" : "Sign in"}</span>
              {!busy && <ArrowRight size={20} aria-hidden="true" />}
            </button>
          </form>

          {message && <p className="auth-status" role="status" aria-live="polite">{message}</p>}

          <div className="auth-switch">
            <span>{isSignup ? "Already have an account?" : "New to TrackFit?"}</span>
            <button type="button" onClick={toggleMode} disabled={busy}>
              {isSignup ? "Sign in" : "Create an account"}
            </button>
          </div>
          <p className="auth-footnote">Built to make every session count.</p>
        </div>
      </section>
    </main>
  );
}

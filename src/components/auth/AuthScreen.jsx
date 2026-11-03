import { useState } from "react";
import { ArrowRight, Check, Circle, Dumbbell, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { supabase } from "../../services/supabase";
import "./AuthScreen.css";

const passwordRequirements = [
  { label: "At least 8 characters", check: (value) => value.length >= 8 },
  { label: "One uppercase letter", check: (value) => /[A-Z]/.test(value) },
  { label: "One lowercase letter", check: (value) => /[a-z]/.test(value) },
  { label: "One number", check: (value) => /[0-9]/.test(value) },
  { label: "One special character", check: (value) => /[^A-Za-z0-9\s]/.test(value) },
];

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mode, setMode] = useState("signin");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const isSignup = mode === "signup";
  const passwordChecks = passwordRequirements.map((requirement) => ({
    ...requirement,
    passed: requirement.check(password),
  }));
  const meetsPasswordRequirements = passwordChecks.every((requirement) => requirement.passed);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setMessage("");

    if (isSignup) {
      if (!meetsPasswordRequirements) {
        setMessage("Please meet all the password requirements before creating an account.");
        return;
      }
      if (!passwordsMatch) {
        setMessage("Your passwords don't match. Please try again.");
        return;
      }
    }

    setBusy(true);
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
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
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
            <div className="auth-field auth-password-field">
              <LockKeyhole size={19} aria-hidden="true" />
              <input
                id="trackfit-password"
                type={showPassword ? "text" : "password"}
                autoComplete={isSignup ? "new-password" : "current-password"}
                placeholder={isSignup ? "Create a strong password" : "Enter your password"}
                minLength={isSignup ? 8 : 6}
                required
                aria-describedby={isSignup ? "trackfit-password-rules" : undefined}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                className="auth-visibility"
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
              </button>
            </div>

            {isSignup && (
              <>
                <ul className="auth-password-rules" id="trackfit-password-rules" aria-label="Password requirements">
                  {passwordChecks.map((requirement) => (
                    <li key={requirement.label} className={requirement.passed ? "auth-rule-met" : ""}>
                      {requirement.passed
                        ? <Check size={15} aria-hidden="true" />
                        : <Circle size={13} aria-hidden="true" />}
                      <span>{requirement.label}</span>
                    </li>
                  ))}
                </ul>

                <label htmlFor="trackfit-confirm-password">Confirm password</label>
                <div className="auth-field auth-password-field auth-confirm-field">
                  <LockKeyhole size={19} aria-hidden="true" />
                  <input
                    id="trackfit-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Enter your password again"
                    minLength={8}
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    aria-describedby={confirmPassword ? "trackfit-password-match" : undefined}
                  />
                  <button
                    className="auth-visibility"
                    type="button"
                    aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}
                    aria-pressed={showConfirmPassword}
                    onClick={() => setShowConfirmPassword((visible) => !visible)}
                  >
                    {showConfirmPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                  </button>
                </div>
                {confirmPassword && (
                  <p
                    id="trackfit-password-match"
                    className={"auth-password-match " + (passwordsMatch ? "auth-match-success" : "auth-match-error")}
                    role="status"
                  >
                    {passwordsMatch ? "Passwords match." : "Passwords don't match yet."}
                  </p>
                )}
              </>
            )}

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

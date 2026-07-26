import { useState } from "react";
import { Dumbbell, LockKeyhole, Mail } from "lucide-react";
import { supabase } from "../../services/supabase";

const shellStyle = {
  minHeight: "100dvh",
  display: "grid",
  placeItems: "center",
  padding: "24px 16px",
  background:
    "radial-gradient(circle at top, rgba(59, 130, 246, 0.16), transparent 38%), var(--background, #080b12)",
};

const cardStyle = {
  width: "min(100%, 440px)",
  display: "grid",
  gap: 24,
  padding: "clamp(24px, 6vw, 36px)",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: 28,
  background: "rgba(15, 23, 42, 0.92)",
  boxShadow: "0 24px 80px rgba(0, 0, 0, 0.38)",
  backdropFilter: "blur(18px)",
};

const fieldStyle = {
  display: "grid",
  gridTemplateColumns: "22px minmax(0, 1fr)",
  alignItems: "center",
  gap: 10,
  width: "100%",
  padding: "0 14px",
  minHeight: 52,
  border: "1px solid rgba(148, 163, 184, 0.24)",
  borderRadius: 14,
  background: "rgba(2, 6, 23, 0.52)",
};

const inputStyle = {
  width: "100%",
  minWidth: 0,
  border: 0,
  outline: 0,
  background: "transparent",
  color: "inherit",
  font: "inherit",
};

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("signin");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const result = mode === "signup"
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    setBusy(false);
    setMessage(
      result.error
        ? result.error.message
        : mode === "signup"
          ? "Account created. Check your email if confirmation is enabled."
          : "Signed in.",
    );
  }

  const isSignup = mode === "signup";

  return (
    <main style={shellStyle}>
      <section style={cardStyle} aria-labelledby="auth-title">
        <div style={{ display: "grid", gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              display: "grid",
              placeItems: "center",
              borderRadius: 16,
              background: "linear-gradient(135deg, #2563eb, #14b8a6)",
              boxShadow: "0 12px 34px rgba(37, 99, 235, 0.28)",
            }}
          >
            <Dumbbell size={26} color="white" aria-hidden="true" />
          </div>
          <div>
            <p className="eyebrow">TrackFit</p>
            <h1 id="auth-title" style={{ marginBottom: 8 }}>
              {isSignup ? "Create your account" : "Welcome back"}
            </h1>
            <p style={{ margin: 0, color: "var(--muted-foreground, #94a3b8)" }}>
              Your workouts, check-ins and nutrition stay linked to you.
            </p>
          </div>
        </div>

        <form style={{ display: "grid", gap: 16 }} onSubmit={submit}>
          <label style={{ display: "grid", gap: 8 }}>
            <span>Email</span>
            <span style={fieldStyle}>
              <Mail size={18} aria-hidden="true" />
              <input
                style={inputStyle}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </span>
          </label>

          <label style={{ display: "grid", gap: 8 }}>
            <span>Password</span>
            <span style={fieldStyle}>
              <LockKeyhole size={18} aria-hidden="true" />
              <input
                style={inputStyle}
                type="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                placeholder="At least 6 characters"
                minLength={6}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </span>
          </label>

          <button
            type="submit"
            disabled={busy}
            style={{ width: "100%", minHeight: 52, borderRadius: 14, fontWeight: 700 }}
          >
            {busy ? "Working..." : isSignup ? "Create account" : "Sign in"}
          </button>
        </form>

        {message && (
          <p role="status" style={{ margin: 0, textAlign: "center" }}>
            {message}
          </p>
        )}

        <button
          type="button"
          onClick={() => {
            setMode(isSignup ? "signin" : "signup");
            setMessage("");
          }}
          style={{ width: "100%", background: "transparent", border: 0 }}
        >
          {isSignup ? "Already have an account? Sign in" : "New to TrackFit? Create an account"}
        </button>
      </section>
    </main>
  );
}

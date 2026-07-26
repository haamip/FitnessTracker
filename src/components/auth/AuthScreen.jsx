import { useState } from "react";
import { Dumbbell, LockKeyhole, Mail } from "lucide-react";
import { supabase } from "../../services/supabase";

const shellStyle = {
  minHeight: "100dvh",
  display: "grid",
  placeItems: "center",
  padding: "24px 16px",
  background: "#080b12",
};

const cardStyle = {
  width: "min(100%, 420px)",
  display: "grid",
  gap: 22,
  padding: "28px 24px",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: 24,
  background: "#111827",
  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.32)",
};

const fieldStyle = {
  display: "grid",
  gridTemplateColumns: "22px minmax(0, 1fr)",
  alignItems: "center",
  gap: 10,
  width: "100%",
  minHeight: 52,
  padding: "0 14px",
  border: "1px solid rgba(148, 163, 184, 0.22)",
  borderRadius: 14,
  background: "#0b1220",
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
            }}
          >
            <Dumbbell size={26} color="white" aria-hidden="true" />
          </div>

          <div>
            <p className="eyebrow">TrackFit</p>
            <h1 id="auth-title" style={{ marginBottom: 8 }}>
              {isSignup ? "Create your account" : "Welcome back"}
            </h1>
            <p style={{ margin: 0, color: "#94a3b8" }}>
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

import { useState } from "react";
import { supabase } from "../../services/supabase";

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
    setMessage(result.error ? result.error.message : mode === "signup" ? "Check your email to confirm your account." : "Signed in.");
  }

  return <main className="screen" style={{display:"grid",alignContent:"center",minHeight:"70vh",gap:20}}><section className="form-card form-grid"><div><p className="eyebrow">TrackFit</p><h1>{mode === "signup" ? "Create account" : "Welcome back"}</h1><p>Your training data stays linked to your account.</p></div><form className="form-grid" onSubmit={submit}><label>Email<input type="email" autoComplete="email" required value={email} onChange={(e)=>setEmail(e.target.value)} /></label><label>Password<input type="password" minLength="6" required value={password} onChange={(e)=>setPassword(e.target.value)} /></label><button type="submit" disabled={busy}>{busy ? "Working..." : mode === "signup" ? "Create account" : "Sign in"}</button></form>{message && <p role="status">{message}</p>}<button type="button" onClick={()=>setMode(mode === "signup" ? "signin" : "signup")}>{mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}</button></section></main>;
}

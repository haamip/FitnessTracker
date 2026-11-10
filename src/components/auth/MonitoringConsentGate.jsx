import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";

/**
 * First signed-in visit: record an explicit yes/no choice. A missing row means
 * the person has not yet been asked; false means they declined.
 * No tracking begins unless consented is explicitly true.
 */
export default function MonitoringConsentGate({ userId, children }) {
  const [state, setState] = useState({ status: "loading", choice: null, error: "" });
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setState({ status: "loading", choice: null, error: "" });
    (async () => {
      const { data, error } = await supabase
        .from("trackfit_ai_monitoring_preferences")
        .select("consented")
        .eq("user_id", userId)
        .maybeSingle();
      if (!active) return;
      setState(error
        ? { status: "error", choice: null, error: error.message }
        : { status: data ? "complete" : "prompt", choice: data?.consented ?? null, error: "" });
    })();
    return () => { active = false; };
  }, [userId, retry]);

  async function choose(consented) {
    if (saving) return;
    setSaving(true);
    const { error } = await supabase.from("trackfit_ai_monitoring_preferences")
      .upsert({ user_id: userId, consented, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      setState({ status: "error", choice: null, error: error.message });
    } else {
      setState({ status: "complete", choice: consented, error: "" });
    }
  }

  if (state.status === "loading") return <main className="screen" role="status">Loading your privacy choice...</main>;
  if (state.status === "error") return <main className="screen" style={{ maxWidth: 560, margin: "auto", padding: 24 }}>
    <h1>Privacy choice unavailable</h1>
    <p role="alert">We couldn't load or save your preference. Nothing has been enabled.</p>
    <button type="button" onClick={() => setRetry((n) => n + 1)}>Try again</button>
  </main>;
  if (state.status === "complete") return children;

  return <main className="screen" style={{ maxWidth: 580, margin: "auto", padding: "32px 20px" }}>
    <section className="form-card" style={{ padding: 24, display: "grid", gap: 16, borderRadius: 18 }}>
      <p className="eyebrow">TRACKFIT BETA · YOUR PRIVACY</p>
      <h1 style={{ margin: 0, lineHeight: 1.15 }}>Help us check your AI Coach's advice</h1>
      <p style={{ lineHeight: 1.65, margin: 0 }}>TrackFit is operated by HAKT Industries Ltd. During beta testing, the developer can privately review your AI Coach questions, generated replies and the activity summary used to create them to spot mistakes, unsafe recommendations and bugs. These records may appear in private testing reports.</p>
      <p style={{ lineHeight: 1.65, margin: 0 }}>This is optional. Choosing <strong>No thanks</strong> will not restrict your workouts or AI Coach. You can change your decision in Profile at any time. Switching monitoring off stops new replies being logged, but does not automatically delete earlier records. Contact the developer to request deletion of earlier monitoring records.</p>
      <p style={{ lineHeight: 1.65, margin: 0 }}>Only new AI responses generated after you agree are eligible for monitoring; previous replies are not collected retroactively.</p>
      <div style={{ display: "grid", gap: 10 }}>
        <button type="button" disabled={saving} onClick={() => void choose(true)} style={{ minHeight: 48, borderRadius: 12, padding: 12, background: "#202820", color: "#dffa7d", fontWeight: 800 }}>{saving ? "Saving..." : "Yes, I agree to AI monitoring"}</button>
        <button type="button" disabled={saving} onClick={() => void choose(false)} style={{ minHeight: 48, borderRadius: 12, padding: 12, border: "1px solid #cbd4c6", background: "#fff", color: "#202820", fontWeight: 700 }}>No thanks, continue to TrackFit</button>
      </div>
    </section>
  </main>;
}

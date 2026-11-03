import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Target } from "lucide-react";
import { supabase } from "../../services/supabase";
import {
  FITNESS_GOALS, SHIFT_PATTERNS, PROFILE_FIELDS,
  getDefaultProfile, normalizeProfile, buildProfilePayload,
} from "../../services/profileGoals";
import "./OnboardingGate.css";

function FirstLoginSetup({ user, existing, onComplete }) {
  const [form, setForm] = useState(() => ({
    ...getDefaultProfile(),
    display_name: user.user_metadata?.display_name || user.email?.split("@")[0] || "",
    ...normalizeProfile(existing),
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const field = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setError("");
  };

  async function save(event) {
    event.preventDefault();
    if (saving) return;
    setError("");
    setSaving(true);
    try {
      const payload = buildProfilePayload(user.id, form);
      const { error: saveError } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
      if (saveError) throw saveError;
      onComplete();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't save your goals. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="tf-onboarding">
      <div className="tf-onboarding-shell">
        <header className="tf-onboarding-top">
          <span className="tf-onboarding-mark"><Target size={25} aria-hidden="true" /></span>
          <div><strong>TRACKFIT</strong><small>YOUR JOURNEY STARTS HERE</small></div>
          <span className="tf-onboarding-step">01 / 01</span>
        </header>

        <section className="tf-onboarding-intro">
          <p className="tf-onboarding-eyebrow">WELCOME TO TRACKFIT</p>
          <h1>Let's make it yours.</h1>
          <p>A couple of quick details help your AI Coach understand what you're working towards. You can change everything later in Profile.</p>
        </section>

        <form className="tf-onboarding-form" onSubmit={save}>
          <div className="tf-onboarding-grid">
            <label className="tf-onboarding-wide">
              What should we call you?
              <input type="text" required maxLength={80} autoComplete="nickname" value={form.display_name} onChange={(event) => field("display_name", event.target.value)} placeholder="Your first name" />
            </label>
            <label className="tf-onboarding-wide">
              What's your main goal?
              <select required value={form.fitness_goal} onChange={(event) => field("fitness_goal", event.target.value)}>
                {FITNESS_GOALS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label>
              Starting weight <span>(kg, optional)</span>
              <input type="number" inputMode="decimal" min="20" max="400" step="0.1" placeholder="e.g. 100" value={form.starting_weight_kg ?? ""} onChange={(event) => field("starting_weight_kg", event.target.value)} />
            </label>
            <label>
              Goal weight <span>(kg, optional)</span>
              <input type="number" inputMode="decimal" min="20" max="400" step="0.1" placeholder="e.g. 95" value={form.goal_weight_kg ?? ""} onChange={(event) => field("goal_weight_kg", event.target.value)} />
            </label>
            <p className="tf-onboarding-hint tf-onboarding-wide">Don't want a weight goal? Leave both fields blank. You can focus on strength, fitness or consistency instead.</p>
            <label>
              Training days each week
              <select value={form.workouts_per_week} onChange={(event) => field("workouts_per_week", event.target.value)}>
                {[1, 2, 3, 4, 5, 6, 7].map((days) => <option key={days} value={days}>{days} {days === 1 ? "day" : "days"}</option>)}
              </select>
            </label>
            <label>
              Work routine
              <select value={form.shift_pattern} onChange={(event) => field("shift_pattern", event.target.value)}>
                {SHIFT_PATTERNS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label>
              Timezone
              <select value={form.timezone} onChange={(event) => field("timezone", event.target.value)}>
                <option value="Australia/Perth">Perth</option>
                <option value="Australia/Adelaide">Adelaide</option>
                <option value="Australia/Sydney">Sydney / Melbourne</option>
                <option value="Australia/Brisbane">Brisbane</option>
                <option value="Pacific/Auckland">New Zealand</option>
              </select>
            </label>
          </div>

          <details className="tf-onboarding-details">
            <summary>Optional: review nutrition targets</summary>
            <p>These are editable placeholders, not personalised nutrition advice. Update them if you already have targets.</p>
            <div className="tf-onboarding-grid">
              <label>Daily calories
                <input type="number" min="1000" max="6000" required value={form.calorie_target} onChange={(event) => field("calorie_target", event.target.value)} />
              </label>
              <label>Daily protein (g)
                <input type="number" min="0" max="400" required value={form.protein_target} onChange={(event) => field("protein_target", event.target.value)} />
              </label>
              <label>Daily water (L)
                <input type="number" min="0.5" max="12" step="0.1" required value={form.water_target_l} onChange={(event) => field("water_target_l", event.target.value)} />
              </label>
            </div>
          </details>

          <div className="tf-onboarding-footer">
            <p><CheckCircle2 size={16} aria-hidden="true" /> Your goals are saved privately to your account. Your coach will use logged check-ins to track progress.</p>
            {error && <p role="alert" className="tf-onboarding-error">{error}</p>}
            <button type="submit" disabled={saving}>
              {saving ? "Saving your goals..." : "Save goals & start TrackFit"}
              {!saving && <ArrowRight size={19} aria-hidden="true" />}
            </button>
            <small>You can change these details anytime in Profile.</small>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function OnboardingGate({ children }) {
  const [state, setState] = useState({ status: "loading", user: null, profile: null });
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    async function checkSetup() {
      try {
        const { data: userData, error: authError } = await supabase.auth.getUser();
        if (authError || !userData.user) throw new Error("Couldn't verify your login. Sign out and try again.");
        const user = userData.user;
        const { data, error } = await supabase.from("profiles")
          .select([...PROFILE_FIELDS, "onboarding_complete"].join(","))
          .eq("id", user.id).maybeSingle();
        if (error) throw error;
        if (active) setState({ status: data?.onboarding_complete ? "complete" : "setup", user, profile: data });
      } catch (error) {
        if (active) setState({ status: "error", user: null, profile: null, message: error instanceof Error ? error.message : "Could not load your setup." });
      }
    }
    void checkSetup();
    return () => { active = false; };
  }, [retry]);

  if (state.status === "loading") return <main className="tf-onboarding-loading" role="status">Loading your TrackFit profile...</main>;
  if (state.status === "error") return <main className="tf-onboarding-loading">
    <p role="alert">{state.message}</p>
    <button type="button" onClick={() => { setState({ status: "loading" }); setRetry((n) => n + 1); }}>Try again</button>
  </main>;
  if (state.status === "setup") return <FirstLoginSetup user={state.user} existing={state.profile} onComplete={() => setState((current) => ({ ...current, status: "complete" }))} />;
  return children;
}

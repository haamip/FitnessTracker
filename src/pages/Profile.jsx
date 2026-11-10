import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Button from "../components/ui/Button";
import { supabase } from "../services/supabase";
import { FITNESS_GOALS, SHIFT_PATTERNS, PROFILE_FIELDS, getDefaultProfile, normalizeProfile, buildProfilePayload } from "../services/profileGoals";
import { getShiftStartTime, setShiftStartTime } from "../services/shift/shiftModeService";
import "./TrackFitScreens.css";

export default function Profile() {
  const [profile, setProfile] = useState(getDefaultProfile);
  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [status, setStatus] = useState("Loading profile...");
  const [saving, setSaving] = useState(false);
  const [nightStart, setNightStart] = useState(getShiftStartTime);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!supabase) return;
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        if (active) setStatus("Could not load account.");
        return;
      }

      if (active) {
        setEmail(userData.user.email || "");
        setIsAdmin(userData.user.app_metadata?.trackfit_admin === true);
      }
      const { data, error } = await supabase
        .from("profiles")
        .select(PROFILE_FIELDS.join(","))
        .eq("id", userData.user.id)
        .maybeSingle();

      if (!active) return;
      if (error) {
        setStatus(error.message);
        return;
      }

      setProfile(normalizeProfile(data));
      setStatus("");
    }

    void loadProfile();
    return () => { active = false; };
  }, []);

  function updateField(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!supabase || saving) return;
    setSaving(true);
    setStatus("");

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error("Your login session could not be found.");
      const payload = buildProfilePayload(userData.user.id, profile);
      const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
      if (error) throw error;
      setShiftStartTime(nightStart);
      setStatus("Goals and profile saved. Your AI Coach can now use your updated targets.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Couldn't save your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div className="screen" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <section className="v4-workout-hero">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Profile & goals</h1>
          <p>Set your own targets. The AI Coach uses your saved goals and check-ins to measure your progress.</p>
        </div>
      </section>

      <form className="form-card form-grid" onSubmit={handleSubmit}>
        <label>
          Email
          <input value={email} disabled />
        </label>

        <label>
          Display name
          <input required maxLength={80} value={profile.display_name} onChange={(event) => updateField("display_name", event.target.value)} placeholder="Your name" />
        </label>

        <label>
          Main fitness goal
          <select value={profile.fitness_goal} onChange={(event) => updateField("fitness_goal", event.target.value)}>
            {FITNESS_GOALS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>

        <label>
          Starting weight (kg) – optional
          <input type="number" inputMode="decimal" min="20" max="400" step="0.1" value={profile.starting_weight_kg ?? ""} onChange={(event) => updateField("starting_weight_kg", event.target.value)} placeholder="e.g. 100" />
        </label>
        <label>
          Goal weight (kg) – optional
          <input type="number" inputMode="decimal" min="20" max="400" step="0.1" value={profile.goal_weight_kg ?? ""} onChange={(event) => updateField("goal_weight_kg", event.target.value)} placeholder="e.g. 95" />
          <small>No weight goal? Leave both boxes blank. You can add or change these anytime.</small>
        </label>

        <label>
          Training sessions per week
          <input type="number" min="1" max="7" step="1" required value={profile.workouts_per_week} onChange={(event) => updateField("workouts_per_week", event.target.value)} />
        </label>

        <label>
          Work and shift routine
          <select value={profile.shift_pattern} onChange={(event) => updateField("shift_pattern", event.target.value)}>
            {SHIFT_PATTERNS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>

        <label>
          Timezone
          <select value={profile.timezone} onChange={(event) => updateField("timezone", event.target.value)}>
            <option value="Pacific/Auckland">New Zealand</option>
            <option value="Australia/Adelaide">Adelaide</option>
            <option value="Australia/Perth">Perth</option>
            <option value="Australia/Sydney">Sydney / Melbourne</option>
            <option value="Australia/Brisbane">Brisbane</option>
          </select>
        </label>

        <label>
          Night shift starts at
          <input type="time" step="900" value={nightStart} onChange={(event) => setNightStart(event.target.value)} required />
          <small>When Night mode is enabled, steps and meals use a 24-hour shift day starting here. Saved on this device.</small>
        </label>

        <label>
          Daily calories
          <input type="number" min="1000" max="6000" value={profile.calorie_target} onChange={(event) => updateField("calorie_target", event.target.value)} required />
        </label>

        <label>
          Daily protein grams
          <input type="number" min="0" max="400" value={profile.protein_target} onChange={(event) => updateField("protein_target", event.target.value)} required />
        </label>

        <label>
          Daily water litres
          <input type="number" min="0.5" max="12" step="0.1" value={profile.water_target_l} onChange={(event) => updateField("water_target_l", event.target.value)} required />
        </label>

        <p style={{ fontSize: 12, opacity: 0.75 }}>Targets are personal preferences, not medical advice. Your coach won't interpret missing weight logs as failure.</p>
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save profile & goals"}</Button>
        {status && <p role="status">{status}</p>}
      </form>
      {isAdmin && <section className="form-card form-grid">
        <h2>Developer dashboard</h2>
        <p>Private beta testing reports, pseudonymous tester activity and consented AI Coach responses.</p>
        <Link to="/dev-tools/testing" style={{ display: "inline-flex", alignItems: "center", minHeight: 44, fontWeight: 800 }}>Open testing dashboard</Link>
      </section>}
      <section className="form-card form-grid">
        <h2>Beta testing privacy</h2>
        <p>Choose whether HAKT Industries may privately review your AI Coach replies, questions and the activity summary used to generate them. This is optional and does not affect your access to the Coach.</p>
        <Link to="/settings/ai-monitoring">Read the agreement and manage AI monitoring</Link>
      </section>
    </motion.div>
  );
}

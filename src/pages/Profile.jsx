import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Button from "../components/ui/Button";
import { supabase } from "../services/supabase";
import "./TrackFitScreens.css";

const initialProfile = {
  display_name: "",
  timezone: "Australia/Adelaide",
  calorie_target: 2500,
  protein_target: 185,
  water_target_l: 4,
};

export default function Profile() {
  const [profile, setProfile] = useState(initialProfile);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("Loading profile...");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!supabase) return;
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        if (active) setStatus("Could not load account.");
        return;
      }

      setEmail(userData.user.email || "");
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, timezone, calorie_target, protein_target, water_target_l")
        .eq("id", userData.user.id)
        .maybeSingle();

      if (!active) return;
      if (error) {
        setStatus(error.message);
        return;
      }

      setProfile({ ...initialProfile, ...(data || {}) });
      setStatus("");
    }

    void loadProfile();
    return () => {
      active = false;
    };
  }, []);

  function updateField(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!supabase) return;
    setSaving(true);
    setStatus("");

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setStatus("Your login session could not be found.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("profiles").upsert({
      id: userData.user.id,
      display_name: profile.display_name.trim(),
      timezone: profile.timezone,
      calorie_target: Number(profile.calorie_target) || 2500,
      protein_target: Number(profile.protein_target) || 185,
      water_target_l: Number(profile.water_target_l) || 4,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    });

    setSaving(false);
    setStatus(error ? error.message : "Profile saved.");
  }

  return (
    <motion.div className="screen" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <section className="v4-workout-hero">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Profile setup</h1>
          <p>Set the targets TrackFit should use across coaching, food and recovery.</p>
        </div>
      </section>

      <form className="form-card form-grid" onSubmit={handleSubmit}>
        <label>
          Email
          <input value={email} disabled />
        </label>

        <label>
          Display name
          <input value={profile.display_name} onChange={(event) => updateField("display_name", event.target.value)} placeholder="Your name" />
        </label>

        <label>
          Timezone
          <select value={profile.timezone} onChange={(event) => updateField("timezone", event.target.value)}>
            <option value="Pacific/Auckland">New Zealand</option>
            <option value="Australia/Adelaide">Adelaide</option>
            <option value="Australia/Perth">Perth</option>
          </select>
        </label>

        <label>
          Daily calories
          <input type="number" min="1000" value={profile.calorie_target} onChange={(event) => updateField("calorie_target", event.target.value)} />
        </label>

        <label>
          Daily protein grams
          <input type="number" min="0" value={profile.protein_target} onChange={(event) => updateField("protein_target", event.target.value)} />
        </label>

        <label>
          Daily water litres
          <input type="number" min="0" step="0.1" value={profile.water_target_l} onChange={(event) => updateField("water_target_l", event.target.value)} />
        </label>

        <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save profile"}</Button>
        {status && <p role="status">{status}</p>}
      </form>
    </motion.div>
  );
}

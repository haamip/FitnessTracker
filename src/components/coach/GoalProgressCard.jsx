import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Target, TrendingUp } from "lucide-react";
import { supabase } from "../../services/supabase";
import { calculateWeightGoalProgress, FITNESS_GOALS } from "../../services/profileGoals";

const goalName = (value) => FITNESS_GOALS.find((goal) => goal.value === value)?.label || "Improve overall fitness";

export default function GoalProgressCard({ revision }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadGoals() {
      if (!supabase) return;
      try {
        const { data: account, error: authError } = await supabase.auth.getUser();
        if (authError || !account.user) return;
        const [{ data: profile, error: profileError }, { data: checkins, error: checkinError }] = await Promise.all([
          supabase.from("profiles")
            .select("fitness_goal,starting_weight_kg,goal_weight_kg,workouts_per_week")
            .eq("id", account.user.id).maybeSingle(),
          supabase.from("daily_checkins")
            .select("weight_kg,checkin_date").eq("user_id", account.user.id)
            .not("weight_kg", "is", null).order("checkin_date", { ascending: false }).limit(1),
        ]);
        if (profileError || checkinError) return;
        if (active) setData({ profile, lastWeight: checkins?.[0] || null });
      } catch {
        // The rest of Home stays available if the optional goal summary cannot load.
      }
    }
    void loadGoals();
    return () => { active = false; };
  }, [revision]);

  if (!data?.profile) return null;
  const { profile, lastWeight } = data;
  const progress = calculateWeightGoalProgress(profile.starting_weight_kg, lastWeight?.weight_kg, profile.goal_weight_kg);
  const hasWeightGoal = profile.goal_weight_kg !== null && profile.goal_weight_kg !== undefined;
  const sessions = Number(profile.workouts_per_week) || 3;

  return (
    <section className="form-card" aria-label="Your goal progress" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <h2 style={{ display: "flex", gap: 9, alignItems: "center", margin: 0, fontSize: 20 }}><Target size={21} aria-hidden="true" /> Your goals</h2>
        <Link to="/profile" style={{ color: "#296044", fontWeight: 750 }}>Edit goals</Link>
      </div>
      <p style={{ marginTop: 12, marginBottom: 5, fontWeight: 800 }}>{goalName(profile.fitness_goal)}</p>
      <p style={{ marginTop: 0, fontSize: 13 }}>Aim for {sessions} {sessions === 1 ? "training day" : "training days"} each week. Your AI Coach will use this target along with the activities you log.</p>
      {progress ? (
        <div style={{ marginTop: 15, borderTop: "1px solid #dfe8df", paddingTop: 14 }}>
          <p style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9, fontWeight: 750 }}><TrendingUp size={17} aria-hidden="true" /> Weight goal progress</p>
          <div role="progressbar" aria-label="Weight goal progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.progressPercent} style={{ height: 10, width: "100%", background: "#dfebde", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ height: "100%", width: progress.progressPercent + "%", background: "#30764e", borderRadius: 10 }} />
          </div>
          <p style={{ marginBottom: 0, fontSize: 13 }}>{progress.progressPercent}% towards your goal · Latest {Number(lastWeight.weight_kg).toFixed(1)} kg · Goal {Number(profile.goal_weight_kg).toFixed(1)} kg</p>
          <small style={{ opacity: .7 }}>Based on your starting weight and most recent synced weight check-in. Normal day-to-day fluctuations can affect this.</small>
        </div>
      ) : (
        <p style={{ fontSize: 12, opacity: .75, marginBottom: 0 }}>
          {hasWeightGoal ? "Log a weight in Daily check-in to start measuring your weight goal." : "No weight goal set — that's fine. Your coach can still follow your training and activity goals."}
        </p>
      )}
    </section>
  );
}

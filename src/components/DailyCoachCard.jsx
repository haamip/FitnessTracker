import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Brain, Sparkles } from "lucide-react";
import { requestTrackFitCoach } from "../services/ai/secureCoachClient";
import { supabase } from "../services/supabase";
import { getOperationalDate } from "../services/shift/shiftModeService";
import "./DailyCoachCard.css";

export default function DailyCoachCard() {
  const [reply, setReply] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!mounted || !user || user.is_anonymous) return;
      const key = `trackfit:daily-ai:${user.id}:${getOperationalDate()}`;
      try {
        const cached = JSON.parse(localStorage.getItem(key) || "null");
        if (cached?.summary) { setReply(cached); return; }
      } catch { /* Bad cache: regenerate on next visit. */ }
      // Only one automatic request per account and operational day on this device.
      const attemptKey = key + ":attempt";
      if (sessionStorage.getItem(attemptKey)) return;
      sessionStorage.setItem(attemptKey, "1");
      setLoading(true);
      try {
        const result = await requestTrackFitCoach("daily");
        if (mounted) { setReply(result); localStorage.setItem(key, JSON.stringify(result)); }
      } catch (caught) {
        if (mounted) setError(caught instanceof Error ? caught.message : "AI Coach is unavailable.");
      } finally { if (mounted) setLoading(false); }
    }
    void load();
    return () => { mounted = false; };
  }, []);
  async function generate() {
    if (loading) return;
    setLoading(true); setError("");
    try {
      const result = await requestTrackFitCoach("daily");
      setReply(result);
      const { data } = await supabase.auth.getUser();
      if (data?.user) localStorage.setItem(`trackfit:daily-ai:${data.user.id}:${getOperationalDate()}`, JSON.stringify(result));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "AI Coach is unavailable."); }
    finally { setLoading(false); }
  }
  return <section className="tf-daily-coach form-card" aria-label="AI daily coaching">
    <div className="tf-daily-coach__heading"><Brain size={22} aria-hidden="true"/><div><p className="eyebrow">PERSONALISED COACHING</p><h2>Your AI Coach</h2></div></div>
    <p>Daily advice based on your signed-in account's last 14 days of synced training, recovery and nutrition.</p>
    <button type="button" onClick={generate} disabled={loading} className="tf-daily-coach__button"><Sparkles size={18} aria-hidden="true"/>{loading ? "Checking your training..." : reply ? "Refresh advice" : "Get today's AI advice"}</button>
    {reply && <div className="tf-daily-coach__reply" role="status">
      <div className="tf-daily-coach__headline">{reply.headline}</div><p className="tf-daily-coach__summary">{reply.summary}</p>
      {reply.actions.length > 0 && <div className="tf-daily-coach__actions"><h3>Your next steps</h3><ol>{reply.actions.map((action,i)=><li key={i}>{action}</li>)}</ol></div>}
      <small className="tf-daily-coach__disclaimer">AI-generated · {reply.dataScope}. Check advice against how you feel today.</small>
    </div>}
    {error && <p role="alert" className="tf-daily-coach__error">{error} <Link to="/coach/intelligence">View regular coaching</Link></p>}
    <small>Automatically checks once per operational day when you visit Coach. Only synced account records are used; progress photos are excluded.</small>
  </section>;
}

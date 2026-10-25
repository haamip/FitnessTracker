import { useState } from "react";
import { Link } from "react-router-dom";
import { Brain, Sparkles } from "lucide-react";
import { requestTrackFitCoach } from "../services/ai/secureCoachClient";
import "./DailyCoachCard.css";

/** AI requests require an explicit tap and send only signed-in cloud records. */
export default function DailyCoachCard() {
  const [reply, setReply] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function generate() {
    if (loading) return;
    setLoading(true);
    setError("");
    try { setReply(await requestTrackFitCoach("daily")); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "AI Coach is unavailable."); }
    finally { setLoading(false); }
  }
  return (
    <section className="tf-daily-coach form-card" aria-label="AI daily coaching">
      <div className="tf-daily-coach__heading"><Brain size={22} aria-hidden="true"/><div><p className="eyebrow">PERSONALISED COACHING</p><h2>Your AI Coach</h2></div></div>
      <p>Get a daily recommendation using your signed-in account's last 14 days of synced workouts, steps, nutrition and recovery.</p>
      <button type="button" onClick={generate} disabled={loading} className="tf-daily-coach__button">
        <Sparkles size={18} aria-hidden="true"/>{loading ? "Checking your training..." : reply ? "Refresh daily coaching" : "Get today's AI advice"}
      </button>
      {reply && (
        <div className="tf-daily-coach__reply" role="status">
          <strong>{reply.headline}</strong><p>{reply.summary}</p>
          {reply.actions.length > 0 && <ul>{reply.actions.map((action, i) => <li key={i}>{action}</li>)}</ul>}
          <small>AI-generated · {reply.dataScope}. Check advice against how you feel today.</small>
        </div>
      )}
      {error && <p role="alert" className="tf-daily-coach__error">{error} <Link to="/coach/intelligence">View your regular Coach Brain</Link></p>}
      <small>Only runs when tapped. Your progress photos are not sent to AI. Missing or unsynced logs may affect advice.</small>
    </section>
  );
}

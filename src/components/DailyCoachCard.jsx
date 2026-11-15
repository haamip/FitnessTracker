import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Brain, Sparkles } from "lucide-react";
import { requestTrackFitCoach } from "../services/ai/secureCoachClient";
import { getOperationalDate } from "../services/shift/shiftModeService";
import { supabase } from "../services/supabase";
import "./DailyCoachCard.css";

/** Automated calls are deduplicated per signed-in account and operational day.
 * The server remains the authority for AI usage limits and monitoring consent.
 * Replies stay in React memory, not persistent browser storage.
 */
export default function DailyCoachCard() {
  const [reply, setReply] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let active = true;
    (async () => {
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      const account = data?.user?.id;
      if (!account || !active) return;
      const day = getOperationalDate();
      const dailyKey = `trackfit:coach-daily:${account}:${day}`;
      const workoutKey = `trackfit:coach-workout:${account}`;
      const workoutId = localStorage.getItem(workoutKey);
      const workoutRequestKey = workoutId ? `trackfit:coach-reviewed:${account}:${workoutId}` : "";
      const needsWorkoutReview = Boolean(workoutId && !sessionStorage.getItem(workoutRequestKey));
      if (!needsWorkoutReview && sessionStorage.getItem(dailyKey)) {
        setContext("Your daily coaching was already requested this session. You can refresh manually.");
        return;
      }
      // Mark attempts before calling to prevent repeated paid requests on navigation.
      sessionStorage.setItem(dailyKey, "attempted");
      if (needsWorkoutReview) sessionStorage.setItem(workoutRequestKey, "attempted");
      if (needsWorkoutReview) localStorage.removeItem(workoutKey);
      setLoading(true);
      setContext(needsWorkoutReview ? "Reviewing your latest workout..." : "Preparing today's coaching...");
      try {
        const response = await requestTrackFitCoach("daily");
        if (active) {
          setReply(response);
          setContext(needsWorkoutReview ? "Post-workout coaching" : "Today's coaching");
        }
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "AI Coach is unavailable.");
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  async function generate() {
    if (loading) return;
    setLoading(true);
    setError("");
    try { setReply(await requestTrackFitCoach("daily")); setContext("Updated coaching"); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "AI Coach is unavailable."); }
    finally { setLoading(false); }
  }
  return (
    <section className="tf-daily-coach form-card" aria-label="AI daily coaching">
      <div className="tf-daily-coach__heading"><Brain size={22} aria-hidden="true"/><div><p className="eyebrow">PERSONALISED COACHING</p><h2>Your AI Coach</h2></div></div>
      <p>Daily advice based on your synced training, steps, nutrition and recovery. Workout feedback appears after you finish a session.</p>
      {context && <p role="status">{context}</p>}
      <button type="button" onClick={generate} disabled={loading} className="tf-daily-coach__button">
        <Sparkles size={18} aria-hidden="true"/>{loading ? "Checking your training..." : "Refresh AI coaching"}
      </button>
      {reply && (
        <div className="tf-daily-coach__reply" role="status">
          <div className="tf-daily-coach__headline">{reply.headline}</div><p className="tf-daily-coach__summary">{reply.summary}</p>
          {reply.actions.length > 0 && <div className="tf-daily-coach__actions"><h3>Your next steps</h3><ol>{reply.actions.map((action, i) => <li key={i}>{action}</li>)}</ol></div>}
          <small className="tf-daily-coach__disclaimer">AI-generated · {reply.dataScope}. Check advice against how you feel today.</small>
        </div>
      )}
      {error && <p role="alert" className="tf-daily-coach__error">{error} <Link to="/coach/intelligence">View your regular Coach Brain</Link></p>}
      <small>Automatic coaching is limited to one daily request per session plus one request per completed workout. Server-side usage limits still apply. Progress photos are never sent to AI; unsynced records may affect advice.</small>
    </section>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckInRepository } from "../../services/repositories/trackfitDataLayer";
import { getOperationalDate, SHIFT_MODE_EVENT } from "../../services/shift/shiftModeService";
import { supabase } from "../../services/supabase";

const SNOOZE_MS = 4 * 60 * 60 * 1000;
export default function DailyCheckInPrompt() {
  const [day, setDay] = useState(getOperationalDate);
  const [account, setAccount] = useState("");
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let active = true;
    supabase?.auth.getUser().then(({ data }) => { if (active) setAccount(data?.user?.id || ""); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const refresh = () => setDay(getOperationalDate());
    window.addEventListener(SHIFT_MODE_EVENT, refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("trackfit:checkin-saved", refresh);
    const timer = window.setInterval(refresh, 60000);
    return () => {
      window.removeEventListener(SHIFT_MODE_EVENT, refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("trackfit:checkin-saved", refresh);
      window.clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    if (!account) return;
    const key = `trackfit:checkin-prompt:${account}:${day}`;
    const completed = CheckInRepository.getAll().some((entry) => entry.date === day);
    const snoozedUntil = Number(localStorage.getItem(key) || 0);
    const shouldShow = !completed && Date.now() >= snoozedUntil;
    // Asynchronous state transition avoids synchronous setState in effects.
    Promise.resolve().then(() => setVisible(shouldShow));
  }, [account, day]);
  if (!visible) return null;
  function remindLater() {
    localStorage.setItem(`trackfit:checkin-prompt:${account}:${day}`, String(Date.now() + SNOOZE_MS));
    setVisible(false);
  }
  return <div role="presentation" style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,.65)",display:"grid",placeItems:"center",padding:20}}>
    <section role="dialog" aria-modal="true" aria-labelledby="daily-checkin-prompt-title" className="form-card" style={{width:"min(100%,420px)",padding:24,borderRadius:20}}>
      <p className="eyebrow">YOUR SHIFT · {day}</p>
      <h2 id="daily-checkin-prompt-title">How are you feeling today?</h2>
      <p>A quick check-in helps your Coach tailor today's training and recovery. Takes about a minute.</p>
      <div style={{display:"grid",gap:12,marginTop:18}}>
        <Link to="/checkin" onClick={() => setVisible(false)} style={{padding:14,borderRadius:12,background:"#25382b",color:"white",textAlign:"center",fontWeight:800}}>Do my check-in</Link>
        <button type="button" onClick={remindLater} style={{padding:12,borderRadius:12}}>Remind me later</button>
      </div>
    </section>
  </div>;
}

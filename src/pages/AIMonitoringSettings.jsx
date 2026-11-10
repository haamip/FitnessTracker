import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
export default function AIMonitoringSettings() {
  const [consented, setConsented] = useState(false);
  const [status, setStatus] = useState("Loading preference...");
  useEffect(() => {
    let live = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) { if(live) setStatus("Please sign in."); return; }
      const { data, error } = await supabase.from("trackfit_ai_monitoring_preferences").select("consented").eq("user_id", auth.user.id).maybeSingle();
      if(live) { setConsented(data?.consented === true); setStatus(error ? error.message : "Your choice is saved securely."); }
    })();
    return () => { live = false; };
  }, []);
  async function save(next) {
    setStatus("Saving...");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) { setStatus("Please sign in."); return; }
    const { error } = await supabase.from("trackfit_ai_monitoring_preferences").upsert({ user_id: auth.user.id, consented: next, updated_at: new Date().toISOString() });
    if (error) setStatus("Could not save: " + error.message);
    else { setConsented(next); setStatus(next ? "AI response monitoring enabled." : "AI response monitoring disabled."); }
  }
  return <main className="screen" style={{maxWidth:700,margin:"auto",padding:24}}>
    <h1>AI Coach testing privacy</h1>
    <p>TrackFit's developer can review your AI Coach replies during beta testing to find inaccurate or unsafe recommendations. If you opt in, your Coach questions, responses and the activity summary used to generate them are stored and may be included in private testing reports.</p>
    <p>This is optional. You can continue using the AI Coach without enabling monitoring. Turning it off stops new responses being logged; it does not automatically erase previously recorded responses. Contact the TrackFit developer if you want earlier monitoring records deleted.</p>
    <label style={{display:"flex",alignItems:"center",gap:12,margin:"24px 0"}}>
      <input type="checkbox" checked={consented} onChange={(e) => void save(e.target.checked)} />
      I agree to AI Coach response monitoring for beta testing.
    </label>
    <p role="status">{status}</p>
  </main>;
}

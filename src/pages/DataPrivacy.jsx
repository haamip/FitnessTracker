import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase";

const OPTIONS = [
  { value: "delete_account", label: "Delete my TrackFit account and associated data" },
  { value: "delete_ai_logs", label: "Delete my previously monitored AI Coach responses" },
  { value: "access_data", label: "Request a copy of my personal data" },
];

export default function DataPrivacy() {
  const [requests, setRequests] = useState([]);
  const [type, setType] = useState("delete_account");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [confirm, setConfirm] = useState(false);

  async function refresh() {
    const { data, error } = await supabase.from("trackfit_data_requests")
      .select("id,request_type,status,created_at")
      .order("created_at", { ascending: false }).limit(20);
    if (error) setMessage("Unable to load requests: " + error.message);
    else setRequests(data || []);
  }
  useEffect(() => { void refresh(); }, []);

  async function submit(event) {
    event.preventDefault();
    if (busy || !confirm) return;
    setBusy(true); setMessage("");
    try {
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError || !userData.user) throw new Error("Please sign in again.");
      const { error } = await supabase.from("trackfit_data_requests")
        .insert({ user_id: userData.user.id, request_type: type });
      if (error) throw error;
      setMessage("Your request has been submitted. It is pending developer review; your data has not been deleted yet.");
      setConfirm(false);
      await refresh();
    } catch (error) { setMessage(error.message || "Could not submit request."); }
    finally { setBusy(false); }
  }

  return <main className="screen" style={{ maxWidth: 680, margin: "auto", padding: "28px 20px 70px" }}>
    <p className="eyebrow">ACCOUNT · PRIVACY</p>
    <h1>Your data and account</h1>
    <p style={{ lineHeight: 1.65 }}>You can request account deletion, removal of previously recorded AI monitoring logs, or a copy of your data. Requests are stored securely and reviewed by the TrackFit developer. <strong>Submitting a request does not immediately delete your account or records.</strong> We will need to confirm and complete deletion, including relevant storage and backups, before marking it done.</p>
    <p>To stop <em>new</em> AI response monitoring immediately, visit <Link to="/settings/ai-monitoring">AI monitoring preferences</Link>.</p>
    <form className="form-card form-grid" onSubmit={submit} style={{ marginTop: 20 }}>
      <label>What would you like to do?
        <select value={type} onChange={(e) => {setType(e.target.value);setConfirm(false);}}>
          {OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>
      <label style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <input type="checkbox" checked={confirm} onChange={e => setConfirm(e.target.checked)} style={{ width: 18, marginTop: 4 }}/>
        <span>I understand this creates a request for review, not an immediate deletion or export.</span>
      </label>
      <button type="submit" disabled={busy || !confirm} style={{ padding: 14, borderRadius: 12, background: "#233428", color: "white", fontWeight: 800 }}>{busy ? "Submitting..." : "Submit privacy request"}</button>
      {message && <p role="status">{message}</p>}
    </form>
    <section style={{ marginTop: 26 }}>
      <h2>My requests</h2>
      {requests.length ? <ul style={{ paddingLeft: 22 }}>{requests.map(r => <li key={r.id} style={{ padding: "8px 0" }}>{OPTIONS.find(o=>o.value===r.request_type)?.label || r.request_type} — <strong>{r.status.replaceAll("_"," ")}</strong> · {new Date(r.created_at).toLocaleDateString()}</li>)}</ul> : <p>No privacy requests submitted yet.</p>}
    </section>
    <p style={{ marginTop: 26 }}><Link to="/profile">Back to Profile</Link> · <Link to="/privacy">Privacy policy</Link></p>
  </main>;
}

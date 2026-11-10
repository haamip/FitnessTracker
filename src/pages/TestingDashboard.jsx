import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase";
import "./TestingDashboard.css";

const SOURCES = [
  ["profiles", "Testers", "created_at"],
  ["workout_sessions", "Workouts", "created_at"],
  ["daily_checkins", "Check-ins", "checkin_date"],
  ["nutrition_entries", "Nutrition", "entry_date"],
  ["cardio_sessions", "Cardio", "session_date"],
  ["trackfit_ai_daily_usage", "AI requests", "usage_date"],
  ["beta_feedback", "Feedback", "created_at"],
  ["trackfit_ai_response_logs", "AI responses", "created_at"],
];
const safe = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
const shortId = (id) => id ? "TF-" + String(id).replaceAll("-", "").slice(0, 8).toUpperCase() : "Unknown";
const EXPORT_FIELDS = {
  profiles: ["timezone","calorie_target","protein_target","water_target_l","onboarding_complete","fitness_goal","workouts_per_week","shift_pattern"],
  workout_sessions: ["title","started_at","completed_at","duration_seconds","completed_sets","total_sets","status"],
  daily_checkins: ["checkin_date","sleep_hours","energy","trained_today","protein_g","water_l","steps"] ,
  nutrition_entries: ["entry_date","meal_type","calories","protein_g","carbs_g","fats_g"],
  cardio_sessions: ["session_date","activity_type","duration_min","distance_km","steps"],
  trackfit_ai_daily_usage: ["usage_date","requests"],
  beta_feedback: ["created_at","status","category"],
  trackfit_ai_response_logs: ["created_at","mode","model","headline","summary","actions","prompt_version"],
};
const day = (value) => String(value || "").slice(0, 10);
const within = (row, dateField, from, to) => {
  const date = day(row[dateField]);
  return (!from || date >= from) && (!to || date <= to);
};

export default function TestingDashboard() {
  const [authorized, setAuthorized] = useState(null);
  const [records, setRecords] = useState({});
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [tester, setTester] = useState("all");
  const [tab, setTab] = useState("Overview");

  const load = useCallback(async () => {
    if (!supabase) { setAuthorized(false); return; }
    setBusy(true);
    const { data: userData, error: authError } = await supabase.auth.getUser();
    const isAdmin = !authError && userData?.user?.app_metadata?.trackfit_admin === true;
    setAuthorized(isAdmin);
    if (!isAdmin) { setBusy(false); return; }
    const output = {}, failures = {};
    await Promise.all(SOURCES.map(async ([table]) => {
      // Pagination avoids silently truncating the report at Supabase's default 1,000 rows.
      let rows = [], start = 0;
      for (let page = 0; page < 100; page++) {
        const { data, error } = await supabase.from(table).select("*").range(start, start + 999);
        if (error) { failures[table] = error.message; break; }
        rows = rows.concat(data || []);
        if (!data || data.length < 1000) break;
        start += 1000;
        if (page === 99) failures[table] = "Export limit reached; results may be incomplete.";
      }
      output[table] = rows;
    }));
    setRecords(output);
    setErrors(failures);
    setBusy(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => Object.fromEntries(SOURCES.map(([table, , dateField]) => [
    table, (records[table] || []).filter((row) => within(row, dateField, from, to) &&
      (tester === "all" || (table === "profiles" ? row.id === tester : row.user_id === tester)))
  ])), [records, from, to, tester]);

  const totals = SOURCES.map(([table, label]) => ({ table, label, count: filtered[table]?.length || 0 }));
  const aiRequests = (filtered.trackfit_ai_daily_usage || []).reduce((sum, row) => sum + Number(row.requests || 0), 0);
  const missing = Object.keys(errors);
  const workoutRecords = filtered.workout_sessions || [];
  const completedWorkouts = workoutRecords.filter((r) => r.status === "completed" && r.completed_at);
  const activeWorkouts = workoutRecords.filter((r) => r.status === "active" || !r.completed_at);
  const longWorkouts = completedWorkouts.filter((r) => Number(r.duration_seconds) > 7200);

  function exportReport() {
    const rows = SOURCES.map(([table, label]) => {
      const data = filtered[table] || [];
      return `<section><h2>${safe(label)} (${data.length})</h2>${data.length ? data.map((item) => {
        const fields = Object.entries(item).filter(([key]) => EXPORT_FIELDS[table]?.includes(key));
        return `<div class="record"><strong>${safe(shortId(item.user_id || item.id))}</strong> ${fields.map(([k,v]) => `<p><b>${safe(k)}:</b> ${safe(typeof v === "object" ? JSON.stringify(v) : v)}</p>`).join("")}</div>`;
      }).join("") : "<p>No records for this period.</p>"}</section>`;
    }).join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>TrackFit Testing Report</title><style>body{font:12px Arial,sans-serif;color:#18212b;margin:28px}h1{color:#173b4a}h2{border-bottom:2px solid #ddd;padding-top:18px}.record{border-bottom:1px solid #ddd;padding:9px 0;break-inside:avoid}.record p{margin:3px 0;overflow-wrap:anywhere}@page{size:A4;margin:16mm}@media print{button{display:none}}</style></head><body><h1>TrackFit Testing Report</h1><p>Generated ${safe(new Date().toISOString())} | From: ${safe(from || "All")} | To: ${safe(to || "All")} | Tester: ${safe(tester === "all" ? "All" : shortId(tester))}</p><p>AI request count: ${aiRequests}. AI response records appear only when monitoring consent is enabled.</p>${missing.length ? `<p><b>Incomplete sources:</b> ${safe(missing.join(", "))}</p>` : ""}${rows}<script>window.addEventListener('load',()=>window.print())<\/script></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `trackfit-testing-${day(new Date().toISOString())}.html`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (authorized === null) return <main className="screen tf-test"><p>Checking admin access...</p></main>;
  if (!authorized) return <main className="screen tf-test"><h1>Restricted access</h1><p>This route is only available to the TrackFit administrator.</p><Link to="/">Back to TrackFit</Link></main>;
  return <main className="screen tf-test">
    <header className="tf-test-head"><div><p className="eyebrow">TrackFit / Developer Tools</p><h1>Testing dashboard</h1><p>Live beta records and audit exports</p></div><div className="tf-test-actions"><Link to="/dev-tools">Developer Tools</Link><button onClick={() => void load()} disabled={busy}>{busy ? "Refreshing..." : "Refresh"}</button></div></header>
    <div className="tf-test-filters"><label>From<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label><label>To<input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label><label>Tester<select value={tester} onChange={(e) => setTester(e.target.value)}><option value="all">All testers</option>{(records.profiles || []).map((p) => <option key={p.id} value={p.id}>{shortId(p.id)}</option>)}</select></label><button onClick={exportReport} disabled={busy || missing.length > 0}>Export report for PDF</button></div>
    {missing.length > 0 && <div className="tf-test-warning" role="alert">Some data could not be loaded: {missing.map((k) => `${k}: ${errors[k]}`).join("; ")}. Export is disabled until all sources load.</div>}
    <div className="tf-test-stats">{totals.map(({table,label,count}) => <article key={table}><span>{label}</span><strong>{table === "trackfit_ai_daily_usage" ? aiRequests : count}</strong></article>)}</div>
    <nav className="tf-test-tabs">{["Overview","Testers","Workouts","Check-ins","Nutrition","Cardio","AI requests","AI responses","Feedback"].map((t) => <button key={t} className={tab===t?"active":""} onClick={() => setTab(t)}>{t}</button>)}</nav>
    {tab === "Overview" ? <section className="tf-test-panel"><h2>Testing snapshot</h2><p>These are real records from TrackFit's cloud database. AI Coach responses will appear here only for testers who explicitly opt into monitoring. Earlier responses were not stored.</p><p>Workouts: {completedWorkouts.length} completed, {activeWorkouts.length} active or unfinished; {longWorkouts.length} completed sessions longer than 2 hours need review. These are records, not unique people.</p><p>For a PDF, download the report, open it in your browser, then choose Print → Save as PDF. Exports use tester codes and an explicit field allowlist; account IDs and sensitive free-text are excluded.</p></section> : (() => {
      const source = SOURCES.find(([,label]) => label === tab);
      const rows = filtered[source?.[0]] || [];
      return <section className="tf-test-panel"><h2>{tab} ({rows.length})</h2><div className="tf-test-table"><table><thead><tr><th>Tester</th><th>Date</th><th>Record</th><th>Details</th></tr></thead><tbody>{rows.map((r, i) => <tr key={r.id || i}><td>{shortId(r.user_id || r.id)}</td><td>{day(r[source[2]])}</td><td>{safe(r.title || r.activity_type || r.meal_type || r.status || source[1])}</td><td>{source[0] === "trackfit_ai_response_logs" ? `${r.headline || ""}: ${r.summary || ""}` : source[0] === "trackfit_ai_daily_usage" ? `${r.requests || 0} requests` : source[0] === "workout_sessions" ? `${r.completed_sets || 0} sets, ${r.duration_seconds || 0} sec` : "Logged"}</td></tr>)}</tbody></table>{!rows.length && <p>No records found.</p>}</div></section>;
    })()}
  </main>;
}

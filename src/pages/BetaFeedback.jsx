import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Camera, CheckCircle2, MessageSquarePlus, Send, X } from "lucide-react";
import { getMyBetaFeedback, submitBetaFeedback, validateFeedback } from "../services/betaFeedbackService";
import "./TrackFitScreens.css";
import "./BetaFeedback.css";

export default function BetaFeedback() {
  const [category,setCategory] = useState("Bug");
  const [description,setDescription] = useState("");
  const [files,setFiles] = useState([]);
  const [consent,setConsent] = useState(false);
  const [busy,setBusy] = useState(false);
  const [status,setStatus] = useState("");
  const [success,setSuccess] = useState(false);
  const [history,setHistory] = useState([]);

  useEffect(()=>{
    let active=true;
    getMyBetaFeedback().then(items=>{if(active)setHistory(items);}).catch(()=>{});
    return ()=>{active=false};
  },[]);

  function pickFiles(event) {
    const selected=Array.from(event.target.files||[]);
    event.target.value="";
    const next=[...files,...selected];
    setStatus("");
    try {
      validateFeedback({category,description:description.length >= 10 ? description : "Checking screenshot file types",files:next});
      setFiles(next);
    } catch (error) {setStatus(error instanceof Error?error.message:"Could not attach those screenshots.");}
  }

  async function sendFeedback(event) {
    event.preventDefault();
    if(busy)return;
    setSuccess(false);
    if(!consent){setStatus("Confirm you want to share these screenshots with the TrackFit team.");return;}
    setBusy(true);setStatus("Sending your feedback...");
    try {
      const payload=validateFeedback({category,description,files});
      const result=await submitBetaFeedback(payload);
      setHistory(cur=>[{...result,category,description},...cur].slice(0,5));
      setDescription("");setFiles([]);setConsent(false);
      setSuccess(true);
      setStatus("Thanks! Your feedback and screenshots have been saved privately to TrackFit.");
    }catch(error){setStatus(error instanceof Error?error.message:"Could not send feedback. Please try again.");}
    finally{setBusy(false);}
  }

  return (
    <main className="screen tf-beta-feedback" data-testid="trackfit-beta-feedback">
      <Link className="tf-feedback-back" to="/"><ArrowLeft size={18}/> Back to Coach</Link>
      <section className="tf-feedback-hero">
        <MessageSquarePlus size={27}/>
        <span className="eyebrow">Help improve TrackFit</span>
        <h1>Send feedback</h1>
        <p>Found a bug, confusing screen or idea? Tell us here. Screenshots help us find it faster.</p>
      </section>
      <form className="tf-feedback-form" onSubmit={sendFeedback}>
        <label>What kind of feedback?
          <select value={category} onChange={event=>setCategory(event.target.value)}>
            <option>Bug</option><option>Suggestion</option><option>Question</option><option>Other</option>
          </select>
        </label>
        <label>What happened, or what would you change?
          <textarea aria-label="Describe your feedback" rows={6} required minLength={10} maxLength={3000}
            value={description} onChange={event=>setDescription(event.target.value)}
            placeholder="Example: I tapped Training Plan, but nothing happened. I'm using a Samsung phone." />
          <small>{description.length}/3000 characters. For a bug, mention the screen and what you expected to happen.</small>
        </label>
        <div className="tf-feedback-attachments">
          <strong><Camera size={18}/> Add screenshots (optional)</strong>
          <p>Up to 3 JPEG, PNG or WebP images, 5 MB each. Screenshots are stored privately with your report, not in Progress Photos.</p>
          <label className="tf-feedback-upload"><Camera size={18}/> Choose screenshots
            <input type="file" aria-label="Upload feedback screenshots" accept="image/jpeg,image/png,image/webp" multiple onChange={pickFiles} disabled={busy || files.length>=3}/>
          </label>
          {files.length>0 && <div className="tf-feedback-files">
            {files.map((file,i)=><div key={i}><span>{file.name} ({Math.round(file.size/1024)} KB)</span>
              <button type="button" aria-label={"Remove screenshot "+(i+1)} onClick={()=>setFiles(cur=>cur.filter((_,idx)=>idx!==i))} disabled={busy}><X size={16}/></button>
            </div>)}
          </div>}
        </div>
        <label className="tf-feedback-consent"><input type="checkbox" checked={consent} onChange={event=>setConsent(event.target.checked)}/>
          <span>I understand my description and any screenshots will be shared privately with the TrackFit team for beta feedback. I'll avoid including sensitive personal information.</span>
        </label>
        <button className="tf-feedback-submit" type="submit" disabled={busy || description.trim().length<10 || !consent}>
          {busy?"Uploading feedback...":<><Send size={18}/> Send to TrackFit</>}
        </button>
        {status && <p className={success?"tf-feedback-success":"tf-feedback-status"} role="status" aria-live="polite">
          {success && <CheckCircle2 size={19}/>} {status}
        </p>}
      </form>
      <section className="tf-feedback-recent">
        <h2>Your recent feedback</h2>
        {!history.length ? <p>No reports sent from this account yet.</p> : history.map(row=>(
          <article key={row.id}><strong>{row.category}</strong>
            <small>{new Date(row.created_at).toLocaleDateString("en-AU",{day:"numeric",month:"short",year:"numeric"})} · Submitted</small>
            <p>{row.description}</p>
          </article>
        ))}
        <p>Feedback is reviewed during beta. You can find submitted reports here when you sign back in.</p>
      </section>
    </main>
  );
}
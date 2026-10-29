import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Brain, Send, Trash2 } from "lucide-react";
import { askCoach } from "../services/ai/aiFeatureService";
import { supabase } from "../services/supabase";
import "./TrackFitScreens.css";
import "./AISuite.css";

/** A single purposeful chat. Workout feedback lives on the Coach screen.
 * The old three-tab page contained a duplicate feedback tool and demo video checker.
 */
export default function AISuite() {
  const [question,setQuestion] = useState("");
  const [messages,setMessages] = useState([]);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");
  const userRef = useRef(null);
  useEffect(()=>{
    if(!supabase)return undefined;
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{
      const next=session?.user?.id||null;
      if(userRef.current!==null && next!==userRef.current){setMessages([]);setQuestion("");setError("");}
      userRef.current=next;
    });
    return ()=>subscription.unsubscribe();
  },[]);
  async function send(event){
    event.preventDefault();
    const text=question.trim();
    if(!text||loading)return;
    setLoading(true);setError("");
    try{
      const answer=await askCoach(text);
      setMessages(cur=>[...cur,{role:"user",text},{role:"coach",text:answer.answer||"Could not generate an answer."}]);
      setQuestion("");
    }catch(e){setError(e instanceof Error?e.message:"The coach is unavailable. Try again.");}
    finally{setLoading(false);}
  }
  return (
    <main className="screen tf-ai-suite tf-coach-chat-page" data-testid="trackfit-coach-chat">
      <Link to="/" className="tf-chat-back"><ArrowLeft size={18}/> Back to Coach</Link>
      <section className="tf-ai-hero"><Brain size={28}/><p className="eyebrow">Your coach</p><h1>Ask TrackFit</h1><p>Ask about your training, recovery or nutrition. Coach advice is based on synced logs and may miss offline entries.</p></section>
      <section className="form-card tf-ai-tool-card">
        <div className="tf-chat-head"><h2>Coach chat</h2><button type="button" onClick={()=>{setMessages([]);setError("");}} disabled={!messages.length} aria-label="Clear coach conversation"><Trash2 size={16}/> Clear</button></div>
        <div className="tf-ai-chat" aria-live="polite">
          {!messages.length && <p className="tf-ai-empty">Try: “How did my training go this week?” or “What should I focus on next?”</p>}
          {messages.map((message,index)=><article key={index} className={message.role}><strong>{message.role==="coach"?"TrackFit Coach":"You"}</strong><p>{message.text}</p></article>)}
        </div>
        {error && <p role="alert" className="tf-ai-error">{error}</p>}
        <form className="tf-ai-chat-form" onSubmit={send}>
          <input aria-label="Ask your TrackFit Coach" placeholder="Ask a training question..." value={question} onChange={e=>setQuestion(e.target.value)} maxLength={700}/>
          <button type="submit" disabled={!question.trim()||loading} aria-label="Send question"><Send size={18}/></button>
        </form>
        <small>Your chat stays on this screen only. AI guidance is not medical advice.</small>
      </section>
      <p><Link to="/coach/weekly">Weekly coaching review</Link> · <Link to="/checkin">Daily check-in</Link></p>
    </main>
  );
}

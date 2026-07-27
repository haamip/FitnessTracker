import { useState } from "react";
import { Bot, Dumbbell, MessageCircle, Send, Sparkles, Upload, Video } from "lucide-react";
import { analyseLiftVideo, askCoach, getWorkoutFeedback } from "../services/ai/aiFeatureService";
import "./TrackFitScreens.css";
import "./AISuite.css";

const tabs = [
  { id: "feedback", label: "Workout feedback", icon: Dumbbell },
  { id: "coach", label: "Coach chat", icon: MessageCircle },
  { id: "form", label: "Form checker", icon: Video },
];

export default function AISuite() {
  const [tab, setTab] = useState("feedback");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [video, setVideo] = useState(null);
  const [lift, setLift] = useState("Squat");
  const [formResult, setFormResult] = useState(null);
  const [error, setError] = useState("");

  async function runFeedback() {
    setLoading(true);
    setError("");
    try {
      setFeedback(await getWorkoutFeedback({ source: "trackfit-app" }));
    } catch (caught) {
      setError(caught.message || "Could not create feedback.");
    } finally {
      setLoading(false);
    }
  }

  async function sendQuestion(event) {
    event.preventDefault();
    const clean = question.trim();
    if (!clean) return;
    setMessages((current) => [...current, { role: "user", text: clean }]);
    setQuestion("");
    setLoading(true);
    setError("");
    try {
      const response = await askCoach(clean, { source: "trackfit-app" });
      setMessages((current) => [...current, { role: "coach", text: response.answer, mode: response.mode }]);
    } catch (caught) {
      setError(caught.message || "Coach chat failed.");
    } finally {
      setLoading(false);
    }
  }

  async function runFormCheck() {
    if (!video) return;
    setLoading(true);
    setError("");
    try {
      setFormResult(await analyseLiftVideo(video, lift));
    } catch (caught) {
      setError(caught.message || "Form check failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="screen tf-ai-suite">
      <section className="tf-ai-hero">
        <Bot size={30} />
        <p className="eyebrow">TrackFit AI</p>
        <h1>Your training copilot</h1>
        <p>AI explains the data. You still make the final call.</p>
      </section>

      <nav className="tf-ai-tabs" aria-label="AI tools">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button className={tab === id ? "active" : ""} key={id} onClick={() => setTab(id)} type="button">
            <Icon size={18} /><span>{label}</span>
          </button>
        ))}
      </nav>

      {tab === "feedback" && (
        <section className="form-card tf-ai-tool-card">
          <p className="eyebrow">Feature 2</p>
          <h2>AI workout feedback</h2>
          <p>Turns workout history, recovery and check-ins into one clear recommendation.</p>
          <button className="tf-ai-primary" disabled={loading} onClick={runFeedback} type="button">
            <Sparkles size={18} /> {loading ? "Reviewing training..." : "Review my training"}
          </button>
          {feedback && (
            <div className="tf-ai-output">
              <strong>{feedback.headline}</strong>
              <p>{feedback.summary}</p>
              <ul>{feedback.actions.map((action) => <li key={action}>{action}</li>)}</ul>
              {feedback.mode === "demo" && <small>Demo output until the secure AI endpoint is connected.</small>}
            </div>
          )}
        </section>
      )}

      {tab === "coach" && (
        <section className="form-card tf-ai-tool-card">
          <p className="eyebrow">Feature 3</p>
          <h2>AI coach chat</h2>
          <div className="tf-ai-chat">
            {messages.length === 0 && <p className="tf-ai-empty">Ask about training, nutrition, recovery or your weekly trend.</p>}
            {messages.map((message, index) => (
              <article className={message.role} key={`${message.role}-${index}`}>
                <strong>{message.role === "coach" ? "TrackFit Coach" : "You"}</strong>
                <p>{message.text}</p>
              </article>
            ))}
          </div>
          <form className="tf-ai-chat-form" onSubmit={sendQuestion}>
            <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Why has my weight gone up this week?" />
            <button disabled={loading || !question.trim()} type="submit"><Send size={18} /></button>
          </form>
        </section>
      )}

      {tab === "form" && (
        <section className="form-card tf-ai-tool-card">
          <p className="eyebrow">Feature 4</p>
          <h2>AI form checker</h2>
          <label>Lift<select value={lift} onChange={(event) => setLift(event.target.value)}><option>Squat</option><option>Bench press</option><option>Deadlift</option><option>Overhead press</option><option>General lift</option></select></label>
          <label className="tf-ai-file-picker">
            <Upload size={24} />
            <strong>{video ? video.name : "Upload a short lifting video"}</strong>
            <span>Best result: 5-15 seconds, whole body visible, 45-degree side angle.</span>
            <input accept="video/*" capture="environment" onChange={(event) => { setVideo(event.target.files?.[0] || null); setFormResult(null); }} type="file" />
          </label>
          <button className="tf-ai-primary" disabled={!video || loading} onClick={runFormCheck} type="button">
            <Video size={18} /> {loading ? "Checking video..." : "Check my form"}
          </button>
          {formResult && (
            <div className="tf-ai-output">
              <strong>{formResult.overall}</strong>
              {formResult.checkpoints.map((item) => <p key={item.label}><b>{item.label}:</b> {item.note}</p>)}
              {formResult.mode === "demo" && <small>The upload flow is ready; pose analysis still needs a backend provider.</small>}
            </div>
          )}
        </section>
      )}

      {error && <p className="tf-ai-error" role="alert">{error}</p>}
    </main>
  );
}

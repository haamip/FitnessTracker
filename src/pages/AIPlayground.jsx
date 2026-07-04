import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bot, Brain, Copy, Database, RefreshCw } from "lucide-react";
import { buildCoachDashboard } from "../services/engines/coachIntelligenceEngine";
import { buildTrackFitAIPlaygroundSnapshot } from "../services/ai/trackfitCoachService";
import "./TrackFitScreens.css";
import "./DeveloperTools.css";

function buildPlaygroundSnapshot() {
  /**
   * WHY THIS EXISTS
   * ----------------
   * The playground should re-run the same coaching pipeline the real app uses.
   * Keeping this in one function lets the first page load and the refresh button
   * rebuild the exact same snapshot without hook warnings.
   */
  const coachIntelligence = buildCoachDashboard();
  const ai = buildTrackFitAIPlaygroundSnapshot({ coachIntelligence });

  return {
    coachIntelligence,
    decisionEngine: coachIntelligence.decision,
    ai,
  };
}

function JsonPanel({ title, data }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="tf-dev-json-card">
      <button onClick={() => setIsOpen((current) => !current)} type="button">
        <strong>{title}</strong>
        <span>{isOpen ? "Hide JSON" : "Show JSON"}</span>
      </button>
      {isOpen && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </section>
  );
}

function TextPanel({ title, eyebrow, children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="tf-dev-json-card">
      <button onClick={() => setIsOpen((current) => !current)} type="button">
        <strong>{title}</strong>
        <span>{isOpen ? "Collapse" : "Expand"}</span>
      </button>
      {isOpen && (
        <div className="tf-history-card" style={{ marginTop: 12 }}>
          <p className="eyebrow">{eyebrow}</p>
          {children}
        </div>
      )}
    </section>
  );
}

function PipelineStep({ title, detail }) {
  return (
    <article>
      <Database size={20} />
      <strong>{title}</strong>
      <span>{detail}</span>
    </article>
  );
}

export default function AIPlayground() {
  const [snapshot, setSnapshot] = useState(() => buildPlaygroundSnapshot());
  const [copyStatus, setCopyStatus] = useState("Ready");

  const decision = snapshot.decisionEngine;
  const coach = snapshot.coachIntelligence;
  const ai = snapshot.ai;
  const mainLimiter = decision.limiters[0] || "No major limiter";
  const mainOpportunity = decision.opportunities[0] || "No clear opportunity yet";

  function refreshPlayground() {
    setSnapshot(buildPlaygroundSnapshot());
    setCopyStatus("Ready");
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(ai.prompt);
      setCopyStatus("Prompt copied");
    } catch {
      setCopyStatus("Copy failed");
    }
  }

  return (
    <main className="screen tf-dev-tools">
      <Link className="tf-back-link" to="/dev-tools">
        <ArrowLeft size={20} /> Back to Developer Tools
      </Link>

      <section className="tf-history-hero">
        <Bot size={30} />
        <p className="eyebrow">Developer Suite</p>
        <h1>AI Playground</h1>
        <span>Compact cockpit for prompt, provider and coaching pipeline checks.</span>
      </section>

      <section className="tf-dev-tool-list">
        <button onClick={refreshPlayground} type="button">
          <RefreshCw size={20} />
          <div>
            <strong>Refresh playground</strong>
            <span>Re-run Coach Intelligence and rebuild the prompt.</span>
          </div>
        </button>

        <button onClick={copyPrompt} type="button">
          <Copy size={20} />
          <div>
            <strong>Copy prompt</strong>
            <span>{copyStatus}</span>
          </div>
        </button>
      </section>

      <section className="tf-dev-grid">
        <article>
          <Brain size={20} />
          <strong>{decision.decisionScore}%</strong>
          <span>{decision.trainingIntensity} decision</span>
        </article>
        <article>
          <Bot size={20} />
          <strong>{ai.provider.active}</strong>
          <span>Real provider disabled</span>
        </article>
        <article>
          <Database size={20} />
          <strong>{ai.cost.totalTokens}</strong>
          <span>Estimated mock tokens</span>
        </article>
      </section>

      <section className="tf-history-card">
        <p className="eyebrow">Current AI Run</p>
        <strong>{decision.nextBestMove.title}</strong>
        <p>{decision.coachSummary}</p>
        <p>Main limiter: {mainLimiter}</p>
        <p>Main opportunity: {mainOpportunity}</p>
        <p>Mock response time: {ai.mockResponse.responseTimeMs}ms</p>
      </section>

      <section className="tf-dev-grid">
        <PipelineStep title="Repositories" detail="History, check-ins, cardio" />
        <PipelineStep title="Engines" detail="Analytics, PR, recovery" />
        <PipelineStep title="Decision" detail={decision.trainingIntensity} />
        <PipelineStep title="Coach" detail={coach.recommendation.workout} />
        <PipelineStep title="Prompt" detail={`${ai.cost.inputTokens} input tokens`} />
        <PipelineStep title="Mock AI" detail="No paid request" />
      </section>

      <TextPanel title="Prompt Preview" eyebrow="Prompt Builder">
        <strong>Exact coaching prompt</strong>
        <p>
          This is what TrackFit will eventually send to the real AI provider.
          For now, it stays local and costs nothing.
        </p>
        <pre>{ai.prompt}</pre>
      </TextPanel>

      <TextPanel title="Mock AI Response" eyebrow="Mock Provider">
        <strong>{ai.mockResponse.provider}</strong>
        <p>{ai.mockResponse.message}</p>
        <p>Response time: {ai.mockResponse.responseTimeMs}ms</p>
      </TextPanel>

      <TextPanel title="Cost Guard" eyebrow="Token Estimate">
        <strong>${ai.cost.estimatedCostAud.toFixed(2)} AUD</strong>
        <p>{ai.cost.note}</p>
        <p>Input tokens: {ai.cost.inputTokens}</p>
        <p>Output tokens: {ai.cost.outputTokens}</p>
      </TextPanel>

      <JsonPanel title="Coach Intelligence output" data={coach} />
      <JsonPanel title="Decision Engine output" data={decision} />
      <JsonPanel title="AI playground output" data={ai} />
    </main>
  );
}

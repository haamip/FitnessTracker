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

  function refreshPlayground() {
    setSnapshot(buildPlaygroundSnapshot());
    setCopyStatus("Ready");
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(snapshot.ai.prompt);
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
        <span>
          Inspect the full coaching pipeline before a real AI provider is wired
          up.
        </span>
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
          <strong>{snapshot.decisionEngine.decisionScore}%</strong>
          <span>Decision score</span>
        </article>
        <article>
          <Bot size={20} />
          <strong>{snapshot.ai.provider.active}</strong>
          <span>{snapshot.ai.provider.status}</span>
        </article>
        <article>
          <Database size={20} />
          <strong>{snapshot.ai.cost.totalTokens}</strong>
          <span>Estimated mock tokens</span>
        </article>
      </section>

      <section className="tf-dev-grid">
        <PipelineStep title="Repositories" detail="History, check-ins and cardio are read first." />
        <PipelineStep title="Engines" detail="Analytics, PR, progression and recovery calculate raw signals." />
        <PipelineStep title="Decision Engine" detail={snapshot.decisionEngine.trainingIntensity} />
        <PipelineStep title="Coach Intelligence" detail={snapshot.coachIntelligence.recommendation.workout} />
        <PipelineStep title="Prompt Builder" detail={`${snapshot.ai.cost.inputTokens} input tokens estimated`} />
        <PipelineStep title="Mock Provider" detail={`${snapshot.ai.mockResponse.responseTimeMs}ms mock response`} />
      </section>

      <section className="tf-history-card">
        <p className="eyebrow">Decision Engine</p>
        <strong>
          {snapshot.decisionEngine.decisionScore}% - {snapshot.decisionEngine.trainingIntensity}
        </strong>
        <p>{snapshot.decisionEngine.coachSummary}</p>
        <p>Readiness band: {snapshot.decisionEngine.readinessBand}</p>
        <p>Next move: {snapshot.decisionEngine.nextBestMove.title}</p>
      </section>

      <section className="tf-history-card">
        <p className="eyebrow">Prompt Preview</p>
        <strong>Exact coaching prompt</strong>
        <p>
          This is what TrackFit will eventually send to the real AI provider.
          For now, it stays local and costs nothing.
        </p>
        <pre>{snapshot.ai.prompt}</pre>
      </section>

      <section className="tf-history-card">
        <p className="eyebrow">Mock AI Response</p>
        <strong>{snapshot.ai.mockResponse.provider}</strong>
        <p>{snapshot.ai.mockResponse.message}</p>
        <p>Response time: {snapshot.ai.mockResponse.responseTimeMs}ms</p>
      </section>

      <section className="tf-history-card">
        <p className="eyebrow">Cost Guard</p>
        <strong>${snapshot.ai.cost.estimatedCostAud.toFixed(2)} AUD</strong>
        <p>{snapshot.ai.cost.note}</p>
        <p>Input tokens: {snapshot.ai.cost.inputTokens}</p>
        <p>Output tokens: {snapshot.ai.cost.outputTokens}</p>
      </section>

      <JsonPanel title="Coach Intelligence output" data={snapshot.coachIntelligence} />
      <JsonPanel title="Decision Engine output" data={snapshot.decisionEngine} />
      <JsonPanel title="AI playground output" data={snapshot.ai} />
    </main>
  );
}

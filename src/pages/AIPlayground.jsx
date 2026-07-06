/*
 * TRACKFIT PAGE
 *
 * Purpose:
 * Main responsibility of this page.
 *
 * Data:
 * Repository and services used by this page.
 *
 * Features:
 * - Feature 1
 * - Feature 2
 * - Feature 3
 *
 * Future:
 * Planned improvements after MVP.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bot, Brain, Copy, Database, RefreshCw } from "lucide-react";
import { buildCoachDashboard } from "../services/engines/coachIntelligenceEngine";
import { buildTrackFitAIPlaygroundSnapshot } from "../services/ai/trackfitCoachService";
import "./TrackFitScreens.css";
import "./DeveloperTools.css";
import "./AIPlayground.css";

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

function formatUsd(value) {
  if (value < 0.0001) return "<$0.0001";
  return `$${value.toFixed(4)}`;
}

function SectionHeader({ title, detail }) {
  return (
    <div className="tf-ai-section-header">
      <h2>{title}</h2>
      <p>{detail}</p>
    </div>
  );
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
        <div className="tf-ai-panel" style={{ marginTop: 12 }}>
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

function CostComparisonTable({ rows }) {
  return (
    <div className="tf-ai-cost-table">
      <div className="tf-ai-cost-row tf-ai-cost-head">
        <span>Provider</span>
        <span>Model</span>
        <span>Input / 1M</span>
        <span>Output / 1M</span>
        <span>Cost if live</span>
      </div>
      {rows.map((row) => (
        <div className="tf-ai-cost-row" key={row.id}>
          <span>{row.provider}</span>
          <strong>{row.model}</strong>
          <span>${row.inputUsdPerMillion}</span>
          <span>${row.outputUsdPerMillion}</span>
          <strong>{formatUsd(row.totalCostUsd)}</strong>
        </div>
      ))}
    </div>
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
    <main className="screen tf-dev-tools tf-ai-playground">
      <Link className="tf-back-link" to="/dev-tools">
        <ArrowLeft size={20} /> Back to Developer Tools
      </Link>

      <section className="tf-history-hero">
        <Bot size={30} />
        <p className="eyebrow">Developer Suite</p>
        <h1>AI Playground</h1>
        <span>Compact cockpit for prompt, provider and coaching pipeline checks.</span>
      </section>

      <section className="tf-ai-section">
        <SectionHeader
          title="Controls"
          detail="Refresh the full coaching pipeline or copy the exact prompt for inspection."
        />
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
      </section>

      <section className="tf-ai-section">
        <SectionHeader
          title="Run summary"
          detail="The top-level state of the current mock AI run."
        />
        <section className="tf-dev-grid tf-ai-metric-grid">
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
      </section>

      <section className="tf-ai-section">
        <SectionHeader
          title="Current decision"
          detail="The human-readable output from TrackFit before AI explains it."
        />
        <section className="tf-ai-panel">
          <p className="eyebrow">Current AI Run</p>
          <strong>{decision.nextBestMove.title}</strong>
          <p>{decision.coachSummary}</p>
          <p>Main limiter: {mainLimiter}</p>
          <p>Main opportunity: {mainOpportunity}</p>
          <p>Mock response time: {ai.mockResponse.responseTimeMs}ms</p>
        </section>
      </section>

      <section className="tf-ai-section">
        <SectionHeader
          title="Cost if live"
          detail="Mock mode still costs $0. These estimates show what the same request would cost on real providers."
        />
        <section className="tf-ai-panel">
          <p className="eyebrow">Cheapest current estimate</p>
          <strong>
            {ai.cost.cheapestModel.model} - {formatUsd(ai.cost.cheapestModel.totalCostUsd)} USD
          </strong>
          <p>
            Input: {ai.cost.inputTokens} tokens. Output: {ai.cost.outputTokens} tokens.
          </p>
          <p>{ai.cost.note}</p>
          <CostComparisonTable rows={ai.cost.comparison} />
        </section>
      </section>

      <section className="tf-ai-section">
        <SectionHeader
          title="Pipeline"
          detail="The order TrackFit follows before any real AI provider gets involved."
        />
        <section className="tf-dev-grid tf-ai-pipeline-grid">
          <PipelineStep title="Repositories" detail="History, check-ins, cardio" />
          <PipelineStep title="Engines" detail="Analytics, PR, recovery" />
          <PipelineStep title="Decision" detail={decision.trainingIntensity} />
          <PipelineStep title="Coach" detail={coach.recommendation.workout} />
          <PipelineStep title="Prompt" detail={`${ai.cost.inputTokens} input tokens`} />
          <PipelineStep title="Mock AI" detail="No paid request" />
        </section>
      </section>

      <section className="tf-ai-section">
        <SectionHeader
          title="Expandable inspection"
          detail="Open these only when you need to inspect prompt text, mock output or estimated cost."
        />
        <TextPanel title="Prompt Preview" eyebrow="Prompt Builder">
          <strong>Exact coaching prompt</strong>
          <p>
            This is what TrackFit will eventually send to the real AI provider.
            For now, it stays local and costs nothing.
          </p>
          <pre className="tf-ai-code-block">{ai.prompt}</pre>
        </TextPanel>

        <TextPanel title="Mock AI Response" eyebrow="Mock Provider">
          <strong>{ai.mockResponse.provider}</strong>
          <p>{ai.mockResponse.message}</p>
          <p>Response time: {ai.mockResponse.responseTimeMs}ms</p>
        </TextPanel>

        <TextPanel title="Cost Guard" eyebrow="Token Estimate">
          <strong>{formatUsd(ai.cost.estimatedCostUsd)} USD in mock mode</strong>
          <p>{ai.cost.note}</p>
          <p>Input tokens: {ai.cost.inputTokens}</p>
          <p>Output tokens: {ai.cost.outputTokens}</p>
        </TextPanel>
      </section>

      <section className="tf-ai-section">
        <SectionHeader
          title="Raw debug output"
          detail="Developer-only JSON kept out of the way until something needs debugging."
        />
        <div className="tf-ai-debug-stack">
          <JsonPanel title="Coach Intelligence output" data={coach} />
          <JsonPanel title="Decision Engine output" data={decision} />
          <JsonPanel title="AI playground output" data={ai} />
        </div>
      </section>
    </main>
  );
}

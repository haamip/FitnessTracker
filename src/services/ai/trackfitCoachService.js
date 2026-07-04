/**
 * ============================================================================
 * TrackFit Coach AI Service
 * ============================================================================
 *
 * PURPOSE
 * -------
 * Prepares TrackFit coaching data for an AI provider.
 *
 * Important idea:
 * The AI is not the brain. TrackFit's repositories and engines make the real
 * decisions first. This service only turns those decisions into a clear prompt
 * and a mock response so we can build safely before paying for real AI calls.
 *
 * Data flow:
 * Repositories -> Engines -> Decision Engine -> Coach Intelligence -> Prompt -> AI
 *
 * ============================================================================
 */

function safeList(items, fallback = "None detected") {
  if (!Array.isArray(items) || items.length === 0) return fallback;
  return items.join(", ");
}

function getTokenEstimate(text) {
  /**
   * WHY THIS EXISTS
   * ----------------
   * Real AI providers charge by tokens, not by normal words.
   * This is only a rough developer estimate. It is good enough for the MVP
   * playground until we connect the real provider usage numbers later.
   */
  return Math.max(1, Math.ceil(String(text || "").length / 4));
}

export function buildTrackFitCoachPrompt({ coachIntelligence, decisionEngine }) {
  const readiness = coachIntelligence.readiness;
  const recommendation = coachIntelligence.recommendation;
  const weeklySummary = coachIntelligence.weeklySummary;
  const fatigue = coachIntelligence.fatigue;
  const plateau = coachIntelligence.plateau;

  return [
    "You are TrackFit Coach.",
    "Turn TrackFit's calculated coaching decision into clear, practical language.",
    "Do not invent numbers, workouts, medical advice, or safety claims.",
    "Use the app's decision as the source of truth.",
    "",
    "TRACKFIT DECISION ENGINE",
    `Decision score: ${decisionEngine.decisionScore}%`,
    `Readiness band: ${decisionEngine.readinessBand}`,
    `Training intensity: ${decisionEngine.trainingIntensity}`,
    `Coach summary: ${decisionEngine.coachSummary}`,
    `Next move: ${decisionEngine.nextBestMove.title}`,
    `Next move detail: ${decisionEngine.nextBestMove.detail}`,
    `Limiters: ${safeList(decisionEngine.limiters)}`,
    `Opportunities: ${safeList(decisionEngine.opportunities)}`,
    "",
    "COACH INTELLIGENCE",
    `Readiness: ${readiness.score}% - ${readiness.status}`,
    `Readiness reason: ${readiness.reason}`,
    `Recommendation: ${recommendation.workout}`,
    `Recommendation reason: ${recommendation.reason}`,
    `Weekly sessions: ${weeklySummary.sessions}`,
    `Weekly volume: ${weeklySummary.volume}kg`,
    `Weekly summary: ${weeklySummary.message}`,
    `Fatigue: ${fatigue.level}`,
    `Fatigue advice: ${fatigue.advice}`,
    `Plateau: ${plateau.message}`,
    "",
    "RESPONSE RULES",
    "1. Start with one short coaching summary.",
    "2. Explain why TrackFit made the decision.",
    "3. Give one practical next action.",
    "4. Keep it friendly, direct, and under 120 words.",
  ].join("\n");
}

export function buildMockTrackFitCoachResponse({ coachIntelligence, decisionEngine }) {
  const nextMove = decisionEngine.nextBestMove;
  const limiterText = decisionEngine.limiters[0]
    ? ` Main limiter: ${decisionEngine.limiters[0].toLowerCase()}.`
    : " No major limiter is standing out.";

  return {
    provider: "mock",
    status: "ready",
    responseTimeMs: 42,
    message: `${decisionEngine.trainingIntensity} day: ${decisionEngine.coachSummary}${limiterText} Next move is ${nextMove.title.toLowerCase()}. ${nextMove.detail}`,
    debug: {
      readinessScore: coachIntelligence.readiness.score,
      decisionScore: decisionEngine.decisionScore,
      route: nextMove.route,
    },
  };
}

export function buildTrackFitAIPlaygroundSnapshot({ coachIntelligence }) {
  const decisionEngine = coachIntelligence.decision;
  const prompt = buildTrackFitCoachPrompt({ coachIntelligence, decisionEngine });
  const mockResponse = buildMockTrackFitCoachResponse({
    coachIntelligence,
    decisionEngine,
  });
  const inputTokens = getTokenEstimate(prompt);
  const outputTokens = getTokenEstimate(mockResponse.message);

  return {
    provider: {
      active: "MockProvider",
      realProviderEnabled: false,
      status: "Mock mode only - no API key or paid request used.",
    },
    prompt,
    mockResponse,
    cost: {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      estimatedCostAud: 0,
      note: "Cost stays $0.00 while the playground uses the mock provider.",
    },
    generatedAt: new Date().toLocaleTimeString(),
  };
}

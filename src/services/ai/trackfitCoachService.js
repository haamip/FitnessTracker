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
 * The AI is not the brain. TrackFit repositories and engines make the real
 * decisions first. This service only turns those decisions into clear language.
 *
 * Data flow:
 * Repositories -> Engines -> Decision Engine -> Coach Intelligence -> Prompt -> AI
 *
 * ============================================================================
 */

const AI_MODEL_PRICES = [
  {
    id: "gemini-2.5-flash-lite",
    provider: "Google",
    model: "Gemini 2.5 Flash-Lite",
    inputUsdPerMillion: 0.1,
    outputUsdPerMillion: 0.4,
    note: "Lowest-cost comparison option for high-volume coaching text.",
  },
  {
    id: "gpt-5.4-nano",
    provider: "OpenAI",
    model: "GPT-5.4 Nano",
    inputUsdPerMillion: 0.2,
    outputUsdPerMillion: 1.25,
    note: "Cheap OpenAI option for simple coaching language.",
  },
  {
    id: "gpt-5.4-mini",
    provider: "OpenAI",
    model: "GPT-5.4 Mini",
    inputUsdPerMillion: 0.75,
    outputUsdPerMillion: 4.5,
    note: "Balanced OpenAI comparison option.",
  },
  {
    id: "claude-haiku-4.5",
    provider: "Anthropic",
    model: "Claude Haiku 4.5",
    inputUsdPerMillion: 1,
    outputUsdPerMillion: 5,
    note: "Fast lower-cost Claude comparison option.",
  },
  {
    id: "claude-sonnet-4.5",
    provider: "Anthropic",
    model: "Claude Sonnet 4.5",
    inputUsdPerMillion: 3,
    outputUsdPerMillion: 15,
    note: "Higher-quality Claude comparison option.",
  },
  {
    id: "gpt-5.5",
    provider: "OpenAI",
    model: "GPT-5.5",
    inputUsdPerMillion: 5,
    outputUsdPerMillion: 30,
    note: "Premium OpenAI comparison option.",
  },
];

function safeList(items, fallback = "None detected") {
  if (!Array.isArray(items) || items.length === 0) return fallback;
  return items.join(", ");
}

function getTokenEstimate(text) {
  return Math.max(1, Math.ceil(String(text || "").length / 4));
}

function calculateModelCost({ inputTokens, outputTokens, model }) {
  const inputCost = (inputTokens / 1_000_000) * model.inputUsdPerMillion;
  const outputCost = (outputTokens / 1_000_000) * model.outputUsdPerMillion;

  return {
    ...model,
    inputCostUsd: inputCost,
    outputCostUsd: outputCost,
    totalCostUsd: inputCost + outputCost,
  };
}

function buildCostComparison({ inputTokens, outputTokens }) {
  return AI_MODEL_PRICES.map((model) =>
    calculateModelCost({ inputTokens, outputTokens, model }),
  ).sort((a, b) => a.totalCostUsd - b.totalCostUsd);
}

function formatNumber(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

export function buildTrackFitCoachPrompt({
  coachIntelligence,
  decisionEngine,
}) {
  const readiness = coachIntelligence.readiness;
  const recommendation = coachIntelligence.recommendation;
  const weeklySummary = coachIntelligence.weeklySummary;
  const fatigue = coachIntelligence.fatigue;
  const plateau = coachIntelligence.plateau;
  const nutrition = coachIntelligence.nutrition;
  const movement = coachIntelligence.movement;

  return [
    "You are TrackFit Coach.",
    "Turn TrackFit's calculated coaching decision into clear, practical language.",
    "Do not invent numbers, workouts, medical advice, or safety claims.",
    "Use the app's decision as the source of truth.",
    "The AI is the voice, not the brain.",
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
    "TRAINING SIGNALS",
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
    "NUTRITION SIGNALS",
    `Nutrition score: ${nutrition.score}%`,
    `Calories today: ${formatNumber(nutrition.calories)} / ${nutrition.calorieTarget}`,
    `Protein today: ${formatNumber(nutrition.protein)}g / ${nutrition.proteinTarget}g`,
    `Carbs today: ${formatNumber(nutrition.carbs)}g`,
    `Fats today: ${formatNumber(nutrition.fats)}g`,
    `Average protein this week: ${formatNumber(nutrition.averageProtein)}g`,
    `Food logging days this week: ${formatNumber(nutrition.daysWithFood)}`,
    `Nutrition message: ${nutrition.message}`,
    "",
    "MOVEMENT SIGNALS",
    `Movement score: ${movement.score}%`,
    `Steps today: ${formatNumber(movement.steps)} / ${movement.stepTarget}`,
    `Distance today: ${formatNumber(movement.distanceKm)}km`,
    `Movement minutes today: ${formatNumber(movement.durationMin)}`,
    `Movement minutes this week: ${formatNumber(movement.weeklyMinutes)} / ${movement.weeklyMinutesTarget}`,
    `Movement message: ${movement.message}`,
    "",
    "RESPONSE RULES",
    "1. Start with one short coaching summary.",
    "2. Explain why TrackFit made the decision using training, food, recovery or movement signals.",
    "3. Give one practical next action.",
    "4. Keep it friendly, direct, and under 120 words.",
  ].join("\n");
}

export function buildMockTrackFitCoachResponse({
  coachIntelligence,
  decisionEngine,
}) {
  const nextMove = decisionEngine.nextBestMove;
  const nutrition = coachIntelligence.nutrition;
  const movement = coachIntelligence.movement;

  const limiterText = decisionEngine.limiters[0]
    ? ` Main limiter: ${decisionEngine.limiters[0].toLowerCase()}.`
    : " No major limiter is standing out.";

  return {
    provider: "mock",
    status: "ready",
    responseTimeMs: 42,
    message: `${decisionEngine.trainingIntensity} day: ${decisionEngine.coachSummary}${limiterText} Protein is ${nutrition.protein}g today and movement is ${Math.round(movement.steps).toLocaleString()} steps. Next move is ${nextMove.title.toLowerCase()}. ${nextMove.detail}`,
    debug: {
      readinessScore: coachIntelligence.readiness.score,
      decisionScore: decisionEngine.decisionScore,
      nutritionScore: nutrition.score,
      movementScore: movement.score,
      route: nextMove.route,
    },
  };
}

export function buildTrackFitAIPlaygroundSnapshot({ coachIntelligence }) {
  const decisionEngine = coachIntelligence.decision;
  const prompt = buildTrackFitCoachPrompt({
    coachIntelligence,
    decisionEngine,
  });
  const mockResponse = buildMockTrackFitCoachResponse({
    coachIntelligence,
    decisionEngine,
  });
  const inputTokens = getTokenEstimate(prompt);
  const outputTokens = getTokenEstimate(mockResponse.message);
  const costComparison = buildCostComparison({ inputTokens, outputTokens });
  const cheapestModel = costComparison[0];

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
      currency: "USD",
      estimatedCostUsd: 0,
      cheapestModel,
      comparison: costComparison,
      note: "Mock mode costs $0.00. These rows estimate what the same prompt would cost if sent live.",
    },
    generatedAt: new Date().toLocaleTimeString(),
  };
}

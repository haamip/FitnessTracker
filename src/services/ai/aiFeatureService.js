import { requestTrackFitCoach } from "./secureCoachClient";
import { requestMealEstimate } from "./mealEstimationClient";

const wait = (ms = 650) => new Promise((resolve) => setTimeout(resolve, ms));

/** Live AI photo analysis. No fabricated demo nutrition data. */
export function analyseMealPhoto(file) {
  return requestMealEstimate({ kind: "photo", file });
}

export function getWorkoutFeedback() {
  return requestTrackFitCoach("daily");
}

export function askCoach(message, options = {}) {
  return requestTrackFitCoach("chat", { question: message, history: options.history });
}

/** Preview-only. Deliberately never uploads a selected video to any endpoint. */
export async function analyseLiftVideo(file, lift = "General lift") {
  if (!file) throw new Error("Choose a video to preview the form checker.");
  await wait(120);
  return {
    mode: "demo", lift, overall: "Demo preview only. This video has not been analysed for lifting technique.",
    checkpoints: [
      { label: "Camera angle", status: "tip", note: "When form analysis launches, use a 45-degree side angle and show the whole body." },
      { label: "Full rep", status: "tip", note: "For future analysis, keep the bar and feet visible for every repetition." },
      { label: "Recovery", status: "tip", note: "This demonstration cannot evaluate fatigue or injury risk from a video." },
    ],
  };
}

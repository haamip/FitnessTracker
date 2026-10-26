import { requestTrackFitCoach } from "./secureCoachClient";
import { estimateMeal } from "./mealEstimateClient";

const wait = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

export async function analyseMealPhoto(file) {
  return estimateMeal({ file });
}

/**
 * Real coaching does not silently return fabricated demo responses.
 * The existing deterministic Coach Brain remains available offline.
 */
export async function getWorkoutFeedback() {
  return requestTrackFitCoach("daily");
}

export async function askCoach(message) {
  return requestTrackFitCoach("chat", { question: message });
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

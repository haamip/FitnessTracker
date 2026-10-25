import { requestTrackFitCoach } from "./secureCoachClient";
import { buildTrackFitAIContext } from "./buildAIContext";

const endpoint = import.meta.env.VITE_TRACKFIT_AI_ENDPOINT?.replace(/\/$/, "");
const wait = (ms = 650) => new Promise((resolve) => setTimeout(resolve, ms));

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}

async function request(path, payload) {
  if (!endpoint) return null;
  const response = await fetch(`${endpoint}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`TrackFit AI request failed (${response.status})`);
  return response.json();
}

export async function analyseMealPhoto(file) {
  const context = buildTrackFitAIContext();
  const live = await request("/meal-scan", {
    image: await fileToDataUrl(file),
    fileName: file.name,
    fileType: file.type,
    context: { shift: context.shift, operationalDate: context.operationalDate, nutrition: context.nutrition },
  });
  if (live) return live;
  await wait();
  return {
    mode: "demo", confidence: 0.76, mealName: "Chicken, rice and vegetables", calories: 640, protein: 58, carbs: 62, fats: 17,
    items: [
      { name: "Chicken breast", amount: "180 g", calories: 300, confidence: 0.88 },
      { name: "Cooked rice", amount: "160 g", calories: 210, confidence: 0.72 },
      { name: "Mixed vegetables", amount: "140 g", calories: 80, confidence: 0.81 },
      { name: "Cooking oil / sauce", amount: "Estimated", calories: 50, confidence: 0.52 },
    ],
  };
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

export async function analyseLiftVideo(file, lift = "General lift") {
  const context = buildTrackFitAIContext();
  const live = await request("/form-check", {
    video: await fileToDataUrl(file), lift, fileName: file.name, fileType: file.type,
    context: { shift: context.shift, recovery: context.recovery, training: context.training },
  });
  if (live) return live;
  await wait(900);
  return {
    mode: "demo", lift, overall: "Video received. Live pose analysis is not connected yet.",
    checkpoints: [
      { label: "Camera angle", status: "check", note: "Use a 45-degree side angle and show the whole body." },
      { label: "Full rep", status: "check", note: "Keep the bar and feet visible for every repetition." },
      { label: "Recovery", status: "check", note: `${context.recovery.averageSleepHours || "No"} hours average sleep is currently available to the coach.` },
    ],
  };
}

const endpoint = import.meta.env.VITE_TRACKFIT_AI_ENDPOINT?.replace(/\/$/, "");

const wait = (ms = 650) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(path, payload) {
  if (!endpoint) return null;

  const response = await fetch(`${endpoint}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`TrackFit AI request failed (${response.status})`);
  }

  return response.json();
}

export async function analyseMealPhoto(file) {
  const live = await request("/meal-scan", {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
  });
  if (live) return live;

  await wait();
  return {
    mode: "demo",
    confidence: 0.76,
    mealName: "Chicken, rice and vegetables",
    calories: 640,
    protein: 58,
    carbs: 62,
    fats: 17,
    items: [
      { name: "Chicken breast", amount: "180 g", calories: 300, confidence: 0.88 },
      { name: "Cooked rice", amount: "160 g", calories: 210, confidence: 0.72 },
      { name: "Mixed vegetables", amount: "140 g", calories: 80, confidence: 0.81 },
      { name: "Cooking oil / sauce", amount: "Estimated", calories: 50, confidence: 0.52 },
    ],
  };
}

export async function getWorkoutFeedback(context = {}) {
  const live = await request("/workout-feedback", context);
  if (live) return live;

  await wait();
  return {
    mode: "demo",
    headline: "Keep the session, trim the volume",
    summary:
      "Your recent training is consistent, but recovery looks average. Keep the main lifts and remove one accessory set from each movement today.",
    actions: [
      "Use an RPE cap of 8 on working sets.",
      "Stop a set when technique noticeably slows.",
      "Add 5 kg only after all prescribed reps are clean.",
    ],
  };
}

export async function askCoach(message, context = {}) {
  const live = await request("/coach-chat", { message, context });
  if (live) return live;

  await wait(450);
  return {
    mode: "demo",
    answer:
      "Based on the information currently available, keep today's plan simple: hit your protein target, complete the planned workout at a controlled effort, and judge progress from the weekly trend rather than one day.",
  };
}

export async function analyseLiftVideo(file, lift = "General lift") {
  const live = await request("/form-check", {
    lift,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
  });
  if (live) return live;

  await wait(900);
  return {
    mode: "demo",
    lift,
    overall: "Video received. Live pose analysis is not connected yet.",
    checkpoints: [
      { label: "Camera angle", status: "check", note: "Use a 45-degree side angle and show the whole body." },
      { label: "Full rep", status: "check", note: "Keep the bar and feet visible for every repetition." },
      { label: "Load", status: "check", note: "Use a working weight that still allows repeatable technique." },
    ],
  };
}

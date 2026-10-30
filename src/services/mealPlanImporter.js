// Read pasted or PDF-extracted meal plans without guessing nutrition numbers.
// Supported example: Breakfast: Porridge | 480 kcal | P 35g | C 52g | F 12g
const HEADINGS = [
  ["Breakfast",/^(breakfast|brekkie)$/i],
  ["Lunch",/^(lunch)$/i],
  ["Dinner",/^(dinner|tea)$/i],
  ["Snack",/^(snack|smoko|morning snack|afternoon snack)$/i],
  ["Shake",/^(shake|protein shake)$/i],
  ["Pre-shift meal",/^(pre.shift meal)$/i],
  ["Post-shift meal",/^(post.shift meal)$/i],
];
const METRIC = {
  calories:[/\b(?:calories|kcal)\s*[:=-]?\s*(\d+(?:\.\d+)?)/i,/\b(\d+(?:\.\d+)?)\s*(?:kcal|calories)\b/i],
  protein:[/\b(?:protein|pro|p)\s*[:=-]?\s*(\d+(?:\.\d+)?)\s*g?\b/i,/\b(\d+(?:\.\d+)?)\s*g\s*protein\b/i],
  carbs:[/\b(?:carbs?|carbohydrates?|c)\s*[:=-]?\s*(\d+(?:\.\d+)?)\s*g?\b/i,/\b(\d+(?:\.\d+)?)\s*g\s*carbs?\b/i],
  fats:[/\b(?:fats?|f)\s*[:=-]?\s*(\d+(?:\.\d+)?)\s*g?\b/i,/\b(\d+(?:\.\d+)?)\s*g\s*fats?\b/i],
};
const mealPrefix = /^(breakfast|brekkie|lunch|dinner|tea|snack|smoko|shake|protein shake|pre.shift meal|post.shift meal|morning snack|afternoon snack)\s*[:\-\u2014]\s*/i;
const headingOnly = /^(?:meal plan|daily menu|meal \d+|total|totals|nutrition|macros|day \d+|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s*:?\s*$/i;
function extractMetric(text, key) {
  for (const pattern of METRIC[key]) {
    const match = pattern.exec(text);
    if (match) {
      const value = Number(match[1]);
      if (Number.isFinite(value) && value >= 0 && value <= 20000) return String(value);
    }
  }
  return "";
}
function stripNutrition(text) {
  return text
    .replace(/\b(?:calories|kcal|protein|pro|carbohydrates|carbs|fat|fats|[pcf])\s*[:=-]?\s*\d+(?:\.\d+)?\s*g?\b/gi," ")
    .replace(/\b\d+(?:\.\d+)?\s*(?:kcal|calories|g\s*(?:protein|carbs?|fats?))\b/gi," ")
    .replace(/[|•,;]+/g," ")
    .replace(/\s{2,}/g," ")
    .replace(/^[\s\d.)\-*]+/,"")
    .replace(/[\s\-:]+$/,"")
    .trim();
}
export function parseMealPlanText(input, { maxMeals = 20 } = {}) {
  const text = String(input || "").slice(0, 20000);
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  let activeType = "Meal";
  let ignored = 0;
  const meals = [];
  for (const source of lines) {
    const line = source.replace(/^[•*]\s*/,"").trim();
    if (/^[-|:\s]+$/.test(line) || headingOnly.test(line)) { ignored += 1; continue; }
    const heading = HEADINGS.find(([,regex])=>regex.test(line));
    if (heading) { activeType = heading[0]; continue; }
    let type = activeType;
    let rest = line;
    const matchPrefix = mealPrefix.exec(rest);
    if (matchPrefix) {
      const picked = HEADINGS.find(([,regex]) => regex.test(matchPrefix[1]));
      type = picked?.[0] || matchPrefix[1];
      rest = rest.slice(matchPrefix[0].length);
    }
    const metrics = Object.fromEntries(Object.keys(METRIC).map(key=>[key,extractMetric(rest,key)]));
    const named = stripNutrition(rest).slice(0,120);
    if (!named || /^(?:kcal|calories|protein|carbs|fat|total)\b/i.test(named)) {
      ignored += 1;
      continue;
    }
    if (!matchPrefix && Object.values(metrics).every(v=>v==="")) { ignored += 1; continue; }
    meals.push({
      id: crypto.randomUUID(),
      name: named,
      type,
      ...metrics,
    });
    if (meals.length >= maxMeals) break;
  }
  const reviewCount = meals.filter(row => row.calories === "" || row.protein === "").length;
  return { meals, reviewCount, ignoredLines: ignored, truncated: meals.length >= maxMeals && lines.length > meals.length };
}
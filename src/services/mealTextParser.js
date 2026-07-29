const NUMBER_PATTERN = /(-?\d+(?:\.\d+)?)/;

function cleanLabel(value = "") {
  return value
    .replace(/^[-*•]\s*/, "")
    .replace(/\s*\|\s*/g, " · ")
    .trim();
}

function readNumber(line) {
  const match = line.match(NUMBER_PATTERN);
  return match ? Number.parseFloat(match[1]) : 0;
}

function readValue(lines, labels) {
  const line = lines.find((candidate) =>
    labels.some((label) => candidate.toLowerCase().startsWith(label)),
  );
  return line ? readNumber(line) : 0;
}

export function parseMealText(sourceText = "") {
  const lines = sourceText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  let mealType = "";
  let mealName = "";
  const items = [];
  let inItems = false;

  lines.forEach((line) => {
    const lower = line.toLowerCase();

    if (lower.startsWith("meal:")) {
      mealType = line.slice(line.indexOf(":") + 1).trim();
      return;
    }

    if (lower.startsWith("name:")) {
      mealName = line.slice(line.indexOf(":") + 1).trim();
      return;
    }

    if (lower === "items" || lower === "foods") {
      inItems = true;
      return;
    }

    if (lower === "totals" || lower === "nutrition" || lower === "estimated nutrition") {
      inItems = false;
      return;
    }

    if (inItems && /^[-*•]/.test(line)) items.push(cleanLabel(line));
  });

  const calories = readValue(lines, ["calories:", "calories ", "kcal:", "kcal "]);
  const protein = readValue(lines, ["protein:", "protein "]);
  const carbs = readValue(lines, ["carbs:", "carbohydrates:", "carbs "]);
  const fats = readValue(lines, ["fat:", "fats:", "fat ", "fats "]);

  if (!mealName) mealName = items.join(", ");

  const recognised = Boolean(mealName || items.length || calories || protein || carbs || fats);

  return {
    recognised,
    mealType,
    name: mealName,
    items,
    calories,
    protein,
    carbs,
    fats,
  };
}

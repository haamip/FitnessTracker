const HEADING_PATTERNS = [
  /^(workout|training|program|session|day)\b/i,
  /^(warm[ -]?up|cool[ -]?down|notes?|instructions?|rest)\b/i,
  /^(exercise|movement)\s*[|,;\t]+\s*(sets?|rounds?)\b/i,
  /^(sets?|rounds?)\s*[|,;\t]+\s*(reps?|time|duration)\b/i,
];

const SET_REP_PATTERNS = [
  /^(.*?)\s*(?:[-–—:]?\s*)(\d+)\s*(?:x|×)\s*(\d+(?:\s*[-–—]\s*\d+)?|amrap|failure|max)(.*)$/i,
  /^(.*?)\s*(?:[-–—:]?\s*)(\d+)\s+(?:sets?|rounds?)\s+(?:of\s+)?(\d+(?:\s*[-–—]\s*\d+)?|amrap|failure|max)(.*)$/i,
  /^(.*?)\s*(?:[-–—:]?\s*)(\d+)\s*(?:sets?|rounds?)\s*[x×:]?\s*(\d+(?:\s*[-–—]\s*\d+)?|amrap|failure|max)(.*)$/i,
];

const TABLE_PATTERN = /^(.*?)\s*[|,;\t]+\s*(\d+)\s*[|,;\t]+\s*(\d+(?:\s*[-–—]\s*\d+)?|amrap|failure|max)(.*)$/i;
const DURATION_PATTERN = /^(.*?)\s*(?:[-–—:|]\s*)?(\d+)\s*(?:x|×)\s*(\d+)\s*(sec(?:ond)?s?|mins?|minutes?)(.*)$/i;

// General fallback: everything before the first prescription number is the exercise name.
// The first number is sets and the second number (or range) is reps.
const NUMBER_ORDER_PATTERN = /^(.*?[A-Za-z])\s*(?:[-–—:|,;]\s*|\s+)(\d+)\s*(?:x|×|sets?(?:\s+of)?|rounds?(?:\s+of)?|[-–—:|,;]|\s)\s*(\d+(?:\s*[-–—]\s*\d+)?|amrap|failure|max)\b(.*)$/i;

function cleanLine(value) {
  return value
    .replace(/^\s*(?:[-*•◦▪‣]+|\d+[.)])\s*/, "")
    .replace(/[‐‑‒–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanName(value) {
  return value
    .replace(/\s*[-:|,;]+\s*$/, "")
    .replace(/^\s*(?:exercise|movement)\s*[:|-]\s*/i, "")
    .trim();
}

function midpointRepRange(value) {
  const normalized = String(value).replace(/\s/g, "").replace(/[–—]/g, "-");
  const rangeMatch = normalized.match(/^(\d+)-(\d+)$/);

  if (!rangeMatch) return normalized.toUpperCase();

  const low = Number.parseInt(rangeMatch[1], 10);
  const high = Number.parseInt(rangeMatch[2], 10);
  return String(Math.round((low + high) / 2));
}

function cleanReps(value) {
  return midpointRepRange(value);
}

function cleanNote(value) {
  return value
    .replace(/^\s*[-–—:|,;]+\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeHeading(line) {
  if (!line || HEADING_PATTERNS.some((pattern) => pattern.test(line))) return true;
  if (/^[A-Z\s/&-]{4,}$/.test(line) && !/\d/.test(line)) return true;
  return false;
}

function buildExercise({ name, sets = "", reps = "", note = "", source, confidence }) {
  return {
    id: `import-${crypto.randomUUID()}`,
    name: cleanName(name),
    sets: String(sets),
    reps: cleanReps(String(reps)),
    note: cleanNote(note),
    source,
    confidence,
    needsReview: confidence !== "high" || !sets || !reps,
  };
}

function parseLine(line) {
  const durationMatch = line.match(DURATION_PATTERN);
  if (durationMatch && cleanName(durationMatch[1])) {
    return buildExercise({
      name: durationMatch[1],
      sets: durationMatch[2],
      reps: `${durationMatch[3]} ${durationMatch[4]}`,
      note: durationMatch[5],
      source: line,
      confidence: "high",
    });
  }

  for (const pattern of SET_REP_PATTERNS) {
    const match = line.match(pattern);
    if (match && cleanName(match[1])) {
      return buildExercise({
        name: match[1],
        sets: match[2],
        reps: match[3],
        note: match[4],
        source: line,
        confidence: "high",
      });
    }
  }

  const tableMatch = line.match(TABLE_PATTERN);
  if (tableMatch && cleanName(tableMatch[1])) {
    return buildExercise({
      name: tableMatch[1],
      sets: tableMatch[2],
      reps: tableMatch[3],
      note: tableMatch[4],
      source: line,
      confidence: "high",
    });
  }

  const numberOrderMatch = line.match(NUMBER_ORDER_PATTERN);
  if (numberOrderMatch && cleanName(numberOrderMatch[1])) {
    return buildExercise({
      name: numberOrderMatch[1],
      sets: numberOrderMatch[2],
      reps: numberOrderMatch[3],
      note: numberOrderMatch[4],
      source: line,
      confidence: "high",
    });
  }

  const repOnlyMatch = line.match(/^(.*?)\s*(?:[-–—:|]\s*)?(\d+(?:\s*[-–—]\s*\d+)?|amrap|failure|max)\s*(?:reps?)?(.*)$/i);
  if (repOnlyMatch && cleanName(repOnlyMatch[1]) && /[a-z]/i.test(repOnlyMatch[1])) {
    return buildExercise({
      name: repOnlyMatch[1],
      reps: repOnlyMatch[2],
      note: repOnlyMatch[3],
      source: line,
      confidence: "medium",
    });
  }

  if (/[a-z]/i.test(line) && !looksLikeHeading(line)) {
    return buildExercise({
      name: line,
      source: line,
      confidence: "low",
    });
  }

  return null;
}

/**
 * Parse pasted or PDF-extracted workout text into an editable draft.
 * The first prescription number is sets and the second is reps.
 * Rep ranges are converted to their rounded midpoint.
 */
export function parseWorkoutText(value) {
  const exercises = [];
  const ignoredLines = [];

  String(value || "")
    .split(/\r?\n/)
    .flatMap((line) => {
      const cleaned = cleanLine(line);
      if (!cleaned) return [];

      // PDF extraction often joins several table rows with large whitespace gaps.
      return cleaned.split(/\s{3,}/).map(cleanLine).filter(Boolean);
    })
    .forEach((line) => {
      if (looksLikeHeading(line)) {
        ignoredLines.push(line);
        return;
      }

      const exercise = parseLine(line);
      if (exercise?.name) exercises.push(exercise);
      else ignoredLines.push(line);
    });

  return {
    exercises,
    ignoredLines,
    reviewCount: exercises.filter((exercise) => exercise.needsReview).length,
  };
}

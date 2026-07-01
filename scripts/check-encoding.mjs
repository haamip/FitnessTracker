/* global console, process */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

/**
 * TrackFit encoding guard.
 *
 * Prevents common mojibake from creeping back into source files. These artifacts
 * usually appear when UTF-8 text is copied through a Windows-1252 path, then
 * saved back as UTF-8. The build can still pass, but the app shows ugly text.
 */
const SOURCE_DIRS = ["src", "scripts"];
const TEXT_FILE_EXTENSIONS = new Set([
  ".css",
  ".html",
  ".js",
  ".jsx",
  ".json",
  ".md",
  ".mjs",
  ".ts",
  ".tsx",
]);
const CORRUPTED_TEXT_PATTERNS = ["Â", "Ã", "â€", "â€¦", "â€”", "â€“", "ï»¿"];

async function walkDirectory(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await walkDirectory(fullPath));
      continue;
    }

    if (TEXT_FILE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

async function findEncodingArtifacts() {
  const files = (await Promise.all(SOURCE_DIRS.map((directory) => walkDirectory(directory)))).flat();
  const failures = [];

  for (const file of files) {
    const content = await readFile(file, "utf8");
    const matchedPattern = CORRUPTED_TEXT_PATTERNS.find((pattern) => content.includes(pattern));

    if (matchedPattern) {
      failures.push(`${file} contains corrupted text marker: ${matchedPattern}`);
    }
  }

  return failures;
}

const failures = await findEncodingArtifacts();

if (failures.length > 0) {
  console.error("Encoding artifact check failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Encoding artifact check passed.");

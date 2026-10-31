/* global console */
import { readFileSync, writeFileSync } from "node:fs";

// Never run in Vercel CI. Register HealthKit only for the native iOS bundle.
const entry = "src/main.jsx";
const original = readFileSync(entry, "utf8");
const registration = 'import "../native/ios/registerHealthKit.js";\n';
if (!original.includes(registration)) writeFileSync(entry, registration + original);
console.log("Native iOS HealthKit bridge registered.");

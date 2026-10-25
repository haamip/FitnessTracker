/** Keep only recent, plain-text messages. No cross-session chat storage. */
export function compactCoachChatHistory(messages, maxMessages = 8) {
  if (!Array.isArray(messages)) return [];
  return messages.filter((item) =>
    (item?.role === "user" || item?.role === "coach") &&
    typeof item.text === "string" && item.text.trim()
  ).slice(-maxMessages).map(({ role, text }) => ({
    role, text: Array.from(text, (character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127 ? " " : character).join("").trim().slice(0, 300),
  }));
}

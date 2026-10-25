/** Keep only recent, plain-text messages. No cross-session chat storage. */
export function compactCoachChatHistory(messages, maxMessages = 8) {
  if (!Array.isArray(messages)) return [];
  return messages.filter((item) =>
    (item?.role === "user" || item?.role === "coach") &&
    typeof item.text === "string" && item.text.trim()
  ).slice(-maxMessages).map(({ role, text }) => ({
    role, text: text.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 300),
  }));
}

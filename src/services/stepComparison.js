/**
 * Compare a last-saved TrackFit step total against a fresh, deduplicated
 * Health Connect aggregate without guessing whether the difference is a watch
 * issue, a phone-origin count, a source priority change, or a late sync.
 */
export function compareStepTotals(saved, aggregate) {
  const current = Number(aggregate);
  const prior = saved == null || saved === "" ? null : Number(saved);
  if (!Number.isSafeInteger(current) || current < 0) return { kind: "invalid", difference: null };
  if (!Number.isSafeInteger(prior) || prior < 0) return { kind: "no-saved", difference: null };
  const difference = current - prior;
  return { kind: difference === 0 ? "match" : difference > 0 ? "more-now" : "less-now", difference };
}

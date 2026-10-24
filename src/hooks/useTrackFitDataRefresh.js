import { useCallback, useEffect, useState } from "react";

// Reload dashboard snapshots when the user returns to a tab or any locally
// persisted training, nutrition, or movement record changes.
export default function useTrackFitDataRefresh() {
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((current) => current + 1), []);
  useEffect(() => {
    const onVisibility = () => { if (!document.hidden) refresh(); };
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onFocus);
    window.addEventListener("trackfit:checkin-saved", onFocus);
    window.addEventListener("trackfit:data-changed", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onFocus);
      window.removeEventListener("trackfit:checkin-saved", onFocus);
      window.removeEventListener("trackfit:data-changed", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);
  return [revision, refresh];
}

export function signalTrackFitDataChange() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("trackfit:data-changed"));
}

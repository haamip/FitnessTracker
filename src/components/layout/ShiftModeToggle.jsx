import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { getShiftMode, SHIFT_MODE_EVENT, toggleShiftMode } from "../../services/shift/shiftModeService";

export default function ShiftModeToggle() {
  const [mode, setMode] = useState(getShiftMode);

  useEffect(() => {
    const update = (event) => setMode(event.detail?.mode || getShiftMode());
    window.addEventListener(SHIFT_MODE_EVENT, update);
    return () => window.removeEventListener(SHIFT_MODE_EVENT, update);
  }, []);

  const night = mode === "night";
  return (
    <button
      aria-label={`Switch to ${night ? "day" : "night"} shift`}
      className="shift-mode-toggle"
      onClick={() => setMode(toggleShiftMode())}
      title={`Currently using ${night ? "night" : "day"} shift`}
      type="button"
    >
      {night ? <Moon size={16} /> : <Sun size={16} />}
      <span>{night ? "Night" : "Day"}</span>
    </button>
  );
}

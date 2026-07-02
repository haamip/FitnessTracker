import { Award, Flame, Sparkles, Trophy } from "lucide-react";
import {
  achievements,
  getGamificationState,
  getXpForNextLevel,
} from "../../features/gamification/gamification";

export default function GamificationPanel() {
  const state = getGamificationState();
  const xpTarget = getXpForNextLevel(state.level);
  const progress = Math.min(100, Math.round((state.xp / xpTarget) * 100));
  const unlocked = achievements.filter((item) =>
    state.unlocked.includes(item.id),
  );

  return (
    <section className="v4-game-card">
      <div className="v4-game-head">
        <div>
          <p className="eyebrow">TrackFit level</p>
          <h2>Level {state.level}</h2>
          <span>
            {state.xp} / {xpTarget} XP
          </span>
        </div>

        <div className="v4-game-icon">
          <Trophy size={24} />
        </div>
      </div>

      <div className="v4-game-progress">
        <i style={{ width: `${progress}%` }} />
      </div>

      <div className="v4-game-stats">
        <div>
          <Flame size={18} />
          <strong>{state.streak}</strong>
          <span>Day streak</span>
        </div>

        <div>
          <Award size={18} />
          <strong>{unlocked.length}</strong>
          <span>Unlocked</span>
        </div>
      </div>

      {state.lastReason && (
        <div className="v4-game-unlock">
          <Sparkles size={18} />
          <span>Latest: {state.lastReason}</span>
        </div>
      )}
    </section>
  );
}

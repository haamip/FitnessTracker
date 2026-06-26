import { motion } from "framer-motion";
import {
  Battery,
  BedDouble,
  CheckCircle2,
  Dumbbell,
  Flame,
  HeartPulse,
  Moon,
  Save,
  Scale,
  Sparkles,
  SunMedium,
  Utensils,
  Waves,
} from "lucide-react";

import Button from "../components/ui/Button";
import { completeDailyCheckIn } from "../features/gamification/gamification";
import "./TrackFitScreens.css";

const checkItems = [
  { icon: Scale, label: "Weight", value: "104.2kg", note: "Down 0.3kg" },
  { icon: Utensils, label: "Protein", value: "168g", note: "17g to target" },
  { icon: Waves, label: "Water", value: "3.2L", note: "Goal 4L" },
  { icon: BedDouble, label: "Sleep", value: "7.4h", note: "Good recovery" },
];

const recovery = [
  { label: "Mood", value: "Good", icon: SunMedium },
  { label: "Energy", value: "7/10", icon: Battery },
  { label: "Soreness", value: "Mild", icon: HeartPulse },
];

export default function DailyCheckIn() {
  return (
    <motion.div
      className="screen checkin-v4"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <section className="v4-checkin-hero">
        <div>
          <p className="eyebrow">Daily check-in</p>
          <h1>Today</h1>
          <p>Log the basics. The boring stuff is what moves the needle.</p>
        </div>

        <div className="v4-checkin-date">
          <span>Sat</span>
          <strong>27</strong>
        </div>
      </section>

      <section className="v4-checkin-score">
        <div>
          <p className="eyebrow">Readiness</p>
          <h2>78%</h2>
          <span>Good day to train, but keep recovery in mind.</span>
        </div>

        <div className="v4-checkin-ring" style={{ "--progress": "78%" }}>
          <div>
            <CheckCircle2 size={24} />
          </div>
        </div>
      </section>

      <div className="v4-section-heading">
        <div>
          <p className="eyebrow">Inputs</p>
          <h2>Today&apos;s numbers</h2>
        </div>
        <span>Live</span>
      </div>

      <section className="v4-check-grid">
        {checkItems.map((item) => (
          <article className="v4-check-card" key={item.label}>
            <item.icon size={21} />
            <strong>{item.value}</strong>
            <span>{item.label}</span>
            <small>{item.note}</small>
          </article>
        ))}
      </section>

      <section className="v4-training-toggle">
        <div>
          <p className="eyebrow">Training today?</p>
          <h2>Yes ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â upper strength</h2>
          <span>Workout planned for this shift window.</span>
        </div>

        <div className="v4-training-pill">
          <Dumbbell size={17} />
          Done
        </div>
      </section>

      <div className="v4-section-heading">
        <div>
          <p className="eyebrow">Recovery</p>
          <h2>How you feel</h2>
        </div>
      </div>

      <section className="v4-recovery-list">
        {recovery.map((item) => (
          <article className="v4-recovery-row" key={item.label}>
            <div className="v4-icon-bubble small">
              <item.icon size={18} />
            </div>

            <div>
              <strong>{item.label}</strong>
              <span>{item.value}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="v4-ai-insight">
        <div className="v4-icon-bubble">
          <Sparkles size={22} />
        </div>

        <div>
          <p className="eyebrow">Coach note</p>
          <h2>Protein is close.</h2>
          <p>
            Hit another small protein meal before bed and keep water moving.
            You are close enough that today still counts as a win.
          </p>
        </div>
      </section>

      <Button className="v4-save-checkin" onClick={() => { completeDailyCheckIn(); window.location.reload(); }}>
        <Save size={18} />
        Save check-in
      </Button>

      <section className="v4-mini-summary">
        <Moon size={18} />
        <span>Track the simple stuff daily. That is how the app gets smart.</span>
        <Flame size={18} />
      </section>
    </motion.div>
  );
}
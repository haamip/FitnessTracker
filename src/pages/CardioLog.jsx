import { motion } from "framer-motion";
import {
  Activity,
  Clock,
  Flame,
  HeartPulse,  Plus,
  Route,
  Sparkles,
  Timer,  Zap,
} from "lucide-react";

import Button from "../components/ui/Button";
import LineChartCard from "../components/LineChartCard";
import "./TrackFitScreens.css";

const cardioData = [
  { date: "Mon", distance: 2.4 },
  { date: "Tue", distance: 3.1 },
  { date: "Wed", distance: 0 },
  { date: "Thu", distance: 4.2 },
  { date: "Fri", distance: 3.6 },
];

const sessions = [
  { type: "Incline Walk", distance: "3.6km", time: "32 min", pace: "8:53/km", zone: "Zone 2" },
  { type: "Bike", distance: "8.4km", time: "26 min", pace: "19.4km/h", zone: "Zone 3" },
  { type: "Treadmill", distance: "2.4km", time: "20 min", pace: "8:20/km", zone: "Zone 2" },
];

export default function CardioLog() {
  return (
    <motion.div
      className="screen cardio-v4"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <section className="v4-cardio-hero">
        <div>
          <p className="eyebrow">Cardio</p>
          <h1>13.3km</h1>
          <p>This week&apos;s movement. Keep the engine ticking over.</p>
        </div>

        <div className="v4-cardio-icon">
          <HeartPulse size={28} />
        </div>
      </section>

      <section className="v4-cardio-stats">
        <article>
          <Route size={21} />
          <strong>13.3km</strong>
          <span>Distance</span>
        </article>

        <article>
          <Clock size={21} />
          <strong>78min</strong>
          <span>Time</span>
        </article>

        <article>
          <Flame size={21} />
          <strong>846</strong>
          <span>Calories</span>
        </article>
      </section>

      <section className="v4-cardio-action">
        <div>
          <p className="eyebrow">Log cardio</p>
          <h2>Add today&apos;s session</h2>
          <p>Walk, bike, treadmill, rower â€” it all counts.</p>
        </div>

        <Button className="v4-cardio-add">
          <Plus size={17} />
          Add
        </Button>
      </section>

      <LineChartCard title="Weekly Distance" data={cardioData} dataKey="distance" unit="km" />

      <div className="v4-section-heading">
        <div>
          <p className="eyebrow">Recent</p>
          <h2>Sessions</h2>
        </div>
        <span>3 logged</span>
      </div>

      <section className="v4-cardio-list">
        {sessions.map((session) => (
          <article className="v4-cardio-row" key={`${session.type}-${session.time}`}>
            <div className="v4-cardio-row-icon">
              <Activity size={20} />
            </div>

            <div>
              <strong>{session.type}</strong>
              <p>{session.distance} Â· {session.time} Â· {session.pace}</p>
            </div>

            <span>{session.zone}</span>
          </article>
        ))}
      </section>

      <section className="v4-zone-card">
        <div>
          <p className="eyebrow">Heart-rate zones</p>
          <h2>Most work is Zone 2</h2>
          <p>Good for fat loss, recovery and building the base engine.</p>
        </div>

        <div className="v4-zone-bars">
          <i style={{ height: "42%" }} />
          <i style={{ height: "78%" }} />
          <i style={{ height: "54%" }} />
          <i style={{ height: "30%" }} />
        </div>
      </section>

      <section className="v4-ai-insight">
        <div className="v4-icon-bubble">
          <Sparkles size={22} />
        </div>

        <div>
          <p className="eyebrow">Coach note</p>
          <h2>Cardio is helping the cut.</h2>
          <p>
            Keep two easy Zone 2 sessions and one harder interval session each week.
            That gives fitness without cooking your legs.
          </p>
        </div>
      </section>

      <section className="v4-mini-summary">
        <Timer size={18} />
        <span>Old-school rule: move more, recover smart, keep showing up.</span>
        <Zap size={18} />
      </section>
    </motion.div>
  );
}
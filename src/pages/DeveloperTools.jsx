import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Database, Trash2 } from "lucide-react";
import { clearDemoData, seedDemoData } from "../services/demoSeedData";
import {
  AIPlanRepository,
  CardioRepository,
  CheckInRepository,
  HistoryRepository,
} from "../services/trackfitDataLayer";
import "./TrackFitScreens.css";

function readDemoStatus(action = "Ready") {
  return {
    action,
    planCount: AIPlanRepository.getPlan().length,
    historyCount: HistoryRepository.getAll().length,
    checkInCount: CheckInRepository.getAll().length,
    cardioCount: CardioRepository.getAll().length,
    checkedAt: new Date().toLocaleTimeString(),
  };
}

export default function DeveloperTools() {
  const [status, setStatus] = useState(() => readDemoStatus());

  function handleSeedDemoData() {
    seedDemoData();
    setStatus(readDemoStatus("Seeded demo data"));
  }

  function handleClearDemoData() {
    clearDemoData();
    setStatus(readDemoStatus("Cleared demo data"));
  }

  return (
    <main className="screen tf-dev-tools">
      <Link className="tf-back-link" to="/workouts">
        <ArrowLeft size={20} /> Back to workouts
      </Link>

      <section className="tf-history-hero">
        <Database size={30} />
        <p className="eyebrow">Developer Mode</p>
        <h1>Seed Tools</h1>
        <span>Testing data only. Keep this hidden before public release.</span>
      </section>

      <section className="tf-dev-tool-list">
        <button onClick={handleSeedDemoData} type="button">
          <Database size={20} />
          <div>
            <strong>Seed demo data</strong>
            <span>Add workouts, cardio and check-ins.</span>
          </div>
        </button>

        <button className="danger" onClick={handleClearDemoData} type="button">
          <Trash2 size={20} />
          <div>
            <strong>Clear demo data</strong>
            <span>Remove generated local testing records.</span>
          </div>
        </button>
      </section>

      <section className="tf-history-card">
        <strong>{status.action}</strong>
        <p>Plan days: {status.planCount}</p>
        <p>Workout history: {status.historyCount}</p>
        <p>Check-ins: {status.checkInCount}</p>
        <p>Cardio sessions: {status.cardioCount}</p>
        <span>Checked {status.checkedAt}</span>
      </section>

      <Link className="tf-save-plan-btn" to={`/workouts?refresh=${Date.now()}`}>
        Open workouts
      </Link>
    </main>
  );
}

import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Database, Trash2 } from "lucide-react";
import { clearDemoData, seedDemoData } from "../services/demoSeedData";
import "./TrackFitScreens.css";

export default function DeveloperTools() {
  const navigate = useNavigate();

  function goToWorkouts() {
    navigate(`/workouts?refresh=${Date.now()}`);
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
        <button
          onClick={() => {
            seedDemoData();
            goToWorkouts();
          }}
          type="button"
        >
          <Database size={20} />
          <div>
            <strong>Seed demo data</strong>
            <span>Add workouts, cardio and check-ins.</span>
          </div>
        </button>

        <button
          className="danger"
          onClick={() => {
            clearDemoData();
            goToWorkouts();
          }}
          type="button"
        >
          <Trash2 size={20} />
          <div>
            <strong>Clear demo data</strong>
            <span>Remove generated local testing records.</span>
          </div>
        </button>
      </section>
    </main>
  );
}

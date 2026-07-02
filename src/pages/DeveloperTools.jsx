import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Brain, Database, Dumbbell, RefreshCw, Trash2, UserRound } from "lucide-react";
import { generateDailyCoachBrief } from "../services/aiCoachEngine";
import { buildCoachDashboard } from "../services/coachIntelligenceEngine";
import { DEMO_ATHLETE_PROFILES, generateDemoAthlete } from "../services/demoAthleteGenerator";
import { clearDemoData, seedDemoData } from "../services/demoSeedData";
import { calculateWorkoutTotals, formatClock } from "../services/workoutEngine";
import {
  AIPlanRepository,
  CardioRepository,
  CheckInRepository,
  HistoryRepository,
  WorkoutRepository,
} from "../services/trackfitDataLayer";
import "./TrackFitScreens.css";
import "./DeveloperTools.css";

function readDeveloperSnapshot(action = "Ready") {
  const plan = AIPlanRepository.getPlan();
  const history = HistoryRepository.getAll();
  const checkIns = CheckInRepository.getAll();
  const cardio = CardioRepository.getAll();
  const activeWorkout = WorkoutRepository.getById("workout-1") || [];
  const coach = generateDailyCoachBrief(history);
  const coachIntelligence = buildCoachDashboard();
  const activeTotals = calculateWorkoutTotals(activeWorkout);
  const latestWorkout = history[0] || null;

  return {
    action,
    plan,
    history,
    checkIns,
    cardio,
    activeWorkout,
    activeTotals,
    coach,
    coachIntelligence,
    latestWorkout,
    checkedAt: new Date().toLocaleTimeString(),
  };
}

function JsonPanel({ title, data }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="tf-dev-json-card">
      <button onClick={() => setIsOpen((current) => !current)} type="button">
        <strong>{title}</strong>
        <span>{isOpen ? "Hide JSON" : "Show JSON"}</span>
      </button>
      {isOpen && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </section>
  );
}

export default function DeveloperTools() {
  const [snapshot, setSnapshot] = useState(() => readDeveloperSnapshot());
  const [activeProfile, setActiveProfile] = useState(null);

  const repositoryRows = useMemo(
    () => [
      ["AI plan days", snapshot.plan.length],
      ["Workout history", snapshot.history.length],
      ["Active workout exercises", snapshot.activeWorkout.length],
      ["Check-ins", snapshot.checkIns.length],
      ["Cardio sessions", snapshot.cardio.length],
    ],
    [snapshot],
  );

  function refreshSnapshot(action = "Refreshed") {
    setSnapshot(readDeveloperSnapshot(action));
  }

  function handleSeedDemoData() {
    seedDemoData();
    setActiveProfile(null);
    refreshSnapshot("Seeded demo data");
  }

  function handleSeedDemoAthlete(profile) {
    const result = generateDemoAthlete(profile);
    setActiveProfile(result);
    refreshSnapshot(`Seeded ${result.label}`);
  }

  function handleClearDemoData() {
    clearDemoData();
    setActiveProfile(null);
    refreshSnapshot("Cleared demo data");
  }

  return (
    <main className="screen tf-dev-tools">
      <Link className="tf-back-link" to="/workouts">
        <ArrowLeft size={20} /> Back to workouts
      </Link>

      <section className="tf-history-hero">
        <Database size={30} />
        <p className="eyebrow">Developer Mode</p>
        <h1>TrackFit cockpit</h1>
        <span>Repository, Coach and engine checks in one place.</span>
      </section>

      <section className="tf-dev-tool-list">
        <button onClick={handleSeedDemoData} type="button">
          <Database size={20} />
          <div>
            <strong>Seed demo data</strong>
            <span>Add workouts, cardio and check-ins.</span>
          </div>
        </button>

        <button onClick={() => refreshSnapshot()} type="button">
          <RefreshCw size={20} />
          <div>
            <strong>Refresh inspector</strong>
            <span>Re-read repositories and coach output.</span>
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
        <p className="eyebrow">Demo athlete generator</p>
        <strong>Seed a full athlete profile</strong>
        <p>Use these profiles to test readiness, fatigue, progression and plateau logic.</p>

        <section className="tf-dev-athlete-grid">
          {DEMO_ATHLETE_PROFILES.map((profile) => (
            <button key={profile.id} onClick={() => handleSeedDemoAthlete(profile.id)} type="button">
              <UserRound size={20} />
              <div>
                <strong>{profile.label}</strong>
                <span>Generate repeatable testing history.</span>
              </div>
            </button>
          ))}
        </section>
      </section>

      {activeProfile && (
        <section className="tf-history-card">
          <p className="eyebrow">Active demo profile</p>
          <strong>{activeProfile.label}</strong>
          <p>History: {activeProfile.historyCount} workouts</p>
          <p>Check-ins: {activeProfile.checkInCount}</p>
          <p>Cardio: {activeProfile.cardioCount}</p>
        </section>
      )}

      <section className="tf-history-card tf-dev-status-card">
        <strong>{snapshot.action}</strong>
        {repositoryRows.map(([label, value]) => (
          <p key={label}>{label}: {value}</p>
        ))}
        <span>Checked {snapshot.checkedAt}</span>
      </section>

      <section className="tf-dev-grid">
        <article>
          <Brain size={20} />
          <strong>{snapshot.coachIntelligence.readiness.score}%</strong>
          <span>Real readiness - {snapshot.coachIntelligence.readiness.status}</span>
        </article>
        <article>
          <Dumbbell size={20} />
          <strong>{snapshot.coachIntelligence.weeklySummary.sessions}</strong>
          <span>Real weekly sessions</span>
        </article>
        <article>
          <Database size={20} />
          <strong>{snapshot.coachIntelligence.fatigue.level}</strong>
          <span>Real fatigue level</span>
        </article>
      </section>

      <section className="tf-history-card">
        <p className="eyebrow">Coach Intelligence Engine</p>
        <strong>{snapshot.coachIntelligence.recommendation.workout}</strong>
        <p>{snapshot.coachIntelligence.recommendation.reason}</p>
        <p>Route: {snapshot.coachIntelligence.recommendation.route}</p>
      </section>

      <section className="tf-history-card">
        <p className="eyebrow">Fatigue + Plateau</p>
        <strong>{snapshot.coachIntelligence.fatigue.level} fatigue</strong>
        <p>{snapshot.coachIntelligence.fatigue.advice}</p>
        <p>{snapshot.coachIntelligence.plateau.message}</p>
      </section>

      <section className="tf-history-card">
        <p className="eyebrow">Legacy Daily Coach</p>
        <strong>{snapshot.coach.nextBestMove.title}</strong>
        <p>{snapshot.coach.nextBestMove.detail}</p>
        <p>Action: {snapshot.coach.nextBestMove.action}</p>
        <p>Route: {snapshot.coach.nextBestMove.route}</p>
      </section>

      <section className="tf-history-card">
        <p className="eyebrow">Last Session</p>
        <strong>{snapshot.coach.lastSession.title}</strong>
        <p>{snapshot.coach.lastSession.note}</p>
        <p>Time: {snapshot.coach.lastSession.durationLabel}</p>
        <p>Sets: {snapshot.coach.lastSession.sets}</p>
        <p>Volume: {snapshot.coach.lastSession.volumeLabel}</p>
        <p>PRs: {snapshot.coach.lastSession.prs}</p>
      </section>

      <section className="tf-history-card">
        <p className="eyebrow">Active Workout</p>
        <strong>{snapshot.activeWorkout.length} exercises</strong>
        <p>{snapshot.activeTotals.doneSets}/{snapshot.activeTotals.totalSets} sets complete</p>
        <p>{Math.round(snapshot.activeTotals.volume)}kg active volume</p>
        <p>{formatClock(snapshot.latestWorkout?.seconds || snapshot.latestWorkout?.durationSeconds || 0)} latest saved duration</p>
      </section>

      <JsonPanel title="Coach Intelligence output" data={snapshot.coachIntelligence} />
      <JsonPanel title="Legacy Coach output" data={snapshot.coach} />
      <JsonPanel title="History repository" data={snapshot.history} />
      <JsonPanel title="Active workout repository" data={snapshot.activeWorkout} />
      <JsonPanel title="AI plan repository" data={snapshot.plan} />

      <Link className="tf-save-plan-btn" to="/workouts?refresh=manual">
        Open workouts
      </Link>
    </main>
  );
}

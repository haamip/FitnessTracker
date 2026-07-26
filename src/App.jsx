import "./services/backgroundTimerPatch";
import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Routes, Route, useParams } from "react-router-dom";
import MobileShell from "./components/layout/MobileShell";
import AuthGate from "./components/auth/AuthGate";
import DailyCheckInGate from "./components/auth/DailyCheckInGate";
import "./pages/WorkoutCompleteOverlay.css";
import "./components/common/TrackFitCard.css";

const Splash = lazy(() => import("./pages/Splash"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const PlanSetup = lazy(() => import("./pages/PlanSetup"));
const DailyCheckIn = lazy(() => import("./pages/DailyCheckIn"));
const CardioLog = lazy(() => import("./pages/CardioLog"));
const Progress = lazy(() => import("./pages/Progress"));
const Coach = lazy(() => import("./pages/Coach"));
const Workouts = lazy(() => import("./pages/Workouts"));
const AIWorkoutBuilder = lazy(() => import("./pages/AIWorkoutBuilder"));
const WorkoutImport = lazy(() => import("./pages/WorkoutImport"));
const WorkoutDetail = lazy(() => import("./pages/WorkoutDetail"));
const CoachIntelligence = lazy(() => import("./pages/CoachIntelligence"));
const Nutrition = lazy(() => import("./pages/Nutrition"));
const Profile = lazy(() => import("./pages/Profile"));
const AIPlayground = lazy(() => import("./pages/AIPlayground"));
const CompletedWorkoutDetail = lazy(() => import("./pages/CompletedWorkoutDetail"));
const DeveloperTools = lazy(() => import("./pages/DeveloperTools"));
const ExerciseDetail = lazy(() => import("./pages/ExerciseDetail"));

function WorkoutDetailRoute() {
  const { id = "workout-1" } = useParams();
  return <WorkoutDetail key={id} />;
}

function RouteFallback() {
  return (
    <div className="screen" style={{ display: "grid", minHeight: "60vh", placeItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <strong>Loading TrackFit...</strong>
        <p style={{ margin: "8px 0 0", color: "#777", fontWeight: 800 }}>Preparing your screen.</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  const showDeveloperTools = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_TOOLS === "true";

  return (
    <DailyCheckInGate>
      <MobileShell>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/splash" element={<Splash />} />
            <Route path="/" element={<Coach />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/plan" element={<PlanSetup />} />
            <Route path="/checkin" element={<DailyCheckIn />} />
            <Route path="/cardio" element={<CardioLog />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/coach" element={<Coach />} />
            <Route path="/coach/intelligence" element={<CoachIntelligence />} />
            <Route path="/workouts" element={<Workouts />} />
            <Route path="/workouts/builder" element={<AIWorkoutBuilder />} />
            <Route path="/workouts/import" element={<WorkoutImport />} />
            <Route path="/profile" element={<Profile />} />
            {showDeveloperTools && <Route path="/dev-tools" element={<DeveloperTools />} />}
            {showDeveloperTools && <Route path="/dev-tools/ai" element={<AIPlayground />} />}
            <Route path="/workouts/history/:historyId" element={<CompletedWorkoutDetail />} />
            <Route path="/workouts/:id" element={<WorkoutDetailRoute />} />
            <Route path="/nutrition" element={<Nutrition />} />
            <Route path="/exercises/:id" element={<ExerciseDetail />} />
            <Route path="*" element={<Navigate replace to="/" />} />
          </Routes>
        </Suspense>
      </MobileShell>
    </DailyCheckInGate>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthGate>
        <AppRoutes />
      </AuthGate>
    </BrowserRouter>
  );
}

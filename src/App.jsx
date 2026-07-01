import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import MobileShell from "./components/layout/MobileShell";

/**
 * TrackFit route-level code splitting.
 *
 * Vite was loading every page up front, including heavier pages like
 * Workout Builder, Progress, Coach, and Exercise Detail. On an 8 GB laptop,
 * that makes dev reloads feel chunky.
 *
 * Lazy-loading routes keeps the first app load lighter and only downloads
 * a page when the user actually opens it.
 */
const Splash = lazy(() => import("./pages/Splash"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const PlanSetup = lazy(() => import("./pages/PlanSetup"));
const DailyCheckIn = lazy(() => import("./pages/DailyCheckIn"));
const CardioLog = lazy(() => import("./pages/CardioLog"));
const Progress = lazy(() => import("./pages/Progress"));
const Coach = lazy(() => import("./pages/Coach"));
const Workouts = lazy(() => import("./pages/Workouts"));
const AIWorkoutBuilder = lazy(() => import("./pages/AIWorkoutBuilder"));
const WorkoutDetail = lazy(() => import("./pages/WorkoutDetail"));

function WorkoutDetailRoute() {
  const { id = "workout-1" } = useParams();
  return <WorkoutDetail key={id} />;
}
const CompletedWorkoutDetail = lazy(() => import("./pages/CompletedWorkoutDetail"));
const DeveloperTools = lazy(() => import("./pages/DeveloperTools"));
const ExerciseDetail = lazy(() => import("./pages/ExerciseDetail"));

/**
 * Lightweight route loading state.
 *
 * Keep this intentionally simple so loading a lazy route does not pull in
 * extra components or styling dependencies.
 */
function RouteFallback() {
  return (
    <div className="screen" style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
      <div style={{ textAlign: "center" }}>
        <strong>Loading TrackFit...</strong>
        <p style={{ margin: "8px 0 0", color: "#777", fontWeight: 800 }}>Preparing your screen.</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <MobileShell>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/splash" element={<Splash />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/plan" element={<PlanSetup />} />
            <Route path="/checkin" element={<DailyCheckIn />} />
            <Route path="/cardio" element={<CardioLog />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/coach" element={<Coach />} />
            <Route path="/workouts" element={<Workouts />} />
            <Route path="/workouts/builder" element={<AIWorkoutBuilder />} />
            <Route path="/dev-tools" element={<DeveloperTools />} />
            <Route path="/workouts/history/:historyId" element={<CompletedWorkoutDetail />} />
            <Route path="/workouts/:id" element={<WorkoutDetailRoute />} />
            <Route path="/exercises/:id" element={<ExerciseDetail />} />
          </Routes>
        </Suspense>
      </MobileShell>
    </BrowserRouter>
  );
}

export default App;
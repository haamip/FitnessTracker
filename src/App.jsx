import "./services/backgroundTimerPatch";
import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Routes, Route, useParams, useLocation } from "react-router-dom";
import MobileShell from "./components/layout/MobileShell";
import AuthGate from "./components/auth/AuthGate";
import OnboardingGate from "./components/auth/OnboardingGate";
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
const TrainHome = lazy(() => import("./pages/TrainHome"));
const WorkoutHistory = lazy(() => import("./pages/WorkoutHistory"));
const AIWorkoutBuilder = lazy(() => import("./pages/AIWorkoutBuilder"));
const WorkoutImport = lazy(() => import("./pages/WorkoutImport"));
const CreateWorkout = lazy(() => import("./pages/CreateWorkout"));
const WorkoutDetail = lazy(() => import("./pages/WorkoutDetail"));
const CoachIntelligence = lazy(() => import("./pages/CoachIntelligence"));
const WeeklyCoachReview = lazy(() => import("./pages/WeeklyCoachReview"));
const WeeklyProgressPhotos = lazy(() => import("./pages/WeeklyProgressPhotos"));
const Nutrition = lazy(() => import("./pages/Nutrition"));
const MealPlans = lazy(() => import("./pages/MealPlans"));
const BetaFeedback = lazy(() => import("./pages/BetaFeedback"));
const Profile = lazy(() => import("./pages/Profile"));
const AIPlayground = lazy(() => import("./pages/AIPlayground"));
const AISuite = lazy(() => import("./pages/AISuite"));
const MealScanner = lazy(() => import("./pages/MealScanner"));
const DailyLogs = lazy(() => import("./pages/DailyLogs"));
const WatchSync = lazy(() => import("./pages/WatchSync"));
const CompletedWorkoutDetail = lazy(() => import("./pages/CompletedWorkoutDetail"));
const DeveloperTools = lazy(() => import("./pages/DeveloperTools"));
const TestingDashboard = lazy(() => import("./pages/TestingDashboard"));
const AIMonitoringSettings = lazy(() => import("./pages/AIMonitoringSettings"));
const Legal = lazy(() => import("./pages/Legal"));
const DataPrivacy = lazy(() => import("./pages/DataPrivacy"));
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
            <Route path="/watch" element={<WatchSync />} />
            <Route path="/cardio" element={<CardioLog />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/logs" element={<DailyLogs />} />
            <Route path="/coach" element={<Coach />} />
            <Route path="/coach/intelligence" element={<CoachIntelligence />} />
            <Route path="/coach/weekly" element={<WeeklyCoachReview />} />
            <Route path="/coach/photos" element={<WeeklyProgressPhotos />} />
            <Route path="/ai" element={<AISuite />} />
            <Route path="/workouts" element={<TrainHome />} />
            <Route path="/workouts/library" element={<Workouts />} />
            <Route path="/workouts/history" element={<WorkoutHistory />} />
            <Route path="/workouts/builder" element={<AIWorkoutBuilder />} />
            <Route path="/workouts/import" element={<WorkoutImport />} />
            <Route path="/workouts/create" element={<CreateWorkout />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/privacy" element={<Legal type="privacy" />} />
            <Route path="/terms" element={<Legal type="terms" />} />
            <Route path="/settings/data-privacy" element={<DataPrivacy />} />
            <Route path="/settings/ai-monitoring" element={<AIMonitoringSettings />} />
            {showDeveloperTools && <Route path="/dev-tools" element={<DeveloperTools />} />}
            <Route path="/dev-tools/testing" element={<TestingDashboard />} />
            {showDeveloperTools && <Route path="/dev-tools/ai" element={<AIPlayground />} />}
            <Route path="/workouts/history/:historyId" element={<CompletedWorkoutDetail />} />
            <Route path="/workouts/:id" element={<WorkoutDetailRoute />} />
            <Route path="/nutrition" element={<Nutrition />} />
            <Route path="/nutrition/plans" element={<MealPlans />} />
            <Route path="/feedback" element={<BetaFeedback />} />
            <Route path="/nutrition/scan" element={<MealScanner />} />
            <Route path="/exercises/:id" element={<ExerciseDetail />} />
            <Route path="*" element={<Navigate replace to="/" />} />
          </Routes>
        </Suspense>
      </MobileShell>
    </DailyCheckInGate>
  );
}

function AppContent() {
  const location = useLocation();
  if (location.pathname === "/privacy") return <Legal type="privacy" />;
  if (location.pathname === "/terms") return <Legal type="terms" />;
  return <AuthGate>
        <OnboardingGate>
          <AppRoutes />
        </OnboardingGate>
      </AuthGate>;
}

export default function App() {
  return <BrowserRouter><Suspense fallback={<RouteFallback />}><AppContent /></Suspense></BrowserRouter>;
}

import { BrowserRouter, Routes, Route } from "react-router-dom";
import MobileShell from "./components/layout/MobileShell";
import Dashboard from "./pages/Dashboard";
import PlanSetup from "./pages/PlanSetup";
import DailyCheckIn from "./pages/DailyCheckIn";
import Progress from "./pages/Progress";
import Workouts from "./pages/Workouts";
import WorkoutDetail from "./pages/WorkoutDetail";
import CardioLog from "./pages/CardioLog";
import Splash from "./pages/Splash";

function App() {
  return (
    <BrowserRouter>
      <MobileShell>
        <Routes>
          <Route path="/splash" element={<Splash />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/plan" element={<PlanSetup />} />
          <Route path="/checkin" element={<DailyCheckIn />} />
          <Route path="/cardio" element={<CardioLog />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/workouts" element={<Workouts />} />
          <Route path="/workouts/:id" element={<WorkoutDetail />} />
        </Routes>
      </MobileShell>
    </BrowserRouter>
  );
}

export default App;

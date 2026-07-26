import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { CloudCheckInRepository } from "../../services/repositories/cloudCheckInRepository";

function getLocalDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function DailyCheckInGate({ children }) {
  const location = useLocation();
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let active = true;

    async function checkToday() {
      try {
        const checkIns = await CloudCheckInRepository.getAll();
        const hasCheckedIn = checkIns.some(
          (checkIn) => checkIn.date === getLocalDateKey(),
        );

        if (active) setStatus(hasCheckedIn ? "complete" : "required");
      } catch (error) {
        console.warn("Unable to verify today's check-in.", error);
        const cached = CloudCheckInRepository.getCached();
        const hasCachedCheckIn = cached.some(
          (checkIn) => checkIn.date === getLocalDateKey(),
        );
        if (active) setStatus(hasCachedCheckIn ? "complete" : "required");
      }
    }

    function handleSaved() {
      setStatus("complete");
    }

    void checkToday();
    window.addEventListener("trackfit:checkin-saved", handleSaved);

    return () => {
      active = false;
      window.removeEventListener("trackfit:checkin-saved", handleSaved);
    };
  }, []);

  if (status === "checking") {
    return (
      <main className="screen" style={{ display: "grid", minHeight: "100vh", placeItems: "center" }}>
        <p>Loading TrackFit...</p>
      </main>
    );
  }

  if (status === "required" && location.pathname !== "/checkin") {
    return <Navigate replace state={{ from: location.pathname }} to="/checkin" />;
  }

  return children;
}

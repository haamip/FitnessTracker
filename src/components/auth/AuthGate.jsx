import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../../services/supabase";
import { WorkoutCloudRepository } from "../../services/repositories/workoutCloudRepository";
import { TrainingCloudRepository } from "../../services/repositories/trainingCloudRepository";
import { CheckInRepository, HistoryRepository } from "../../services/repositories/trackfitDataLayer";
import AuthScreen from "./AuthScreen";

export default function AuthGate({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return undefined;
    let mounted = true;

    async function restoreSession() {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;
      if (error) {
        setAuthError(error.message || "Unable to restore your TrackFit session.");
        setLoading(false);
        return;
      }

      const restoredSession = data?.session || null;
      setSession(restoredSession);

      if (restoredSession) {
        CheckInRepository.setActiveUser(restoredSession.user.id);
        HistoryRepository.setActiveUser(restoredSession.user.id);
        try {
          await Promise.all([
            WorkoutCloudRepository.getAll(),
            TrainingCloudRepository.hydrate(),
            CheckInRepository.hydrateForUser(restoredSession.user.id),
          ]);
        } catch (hydrateError) {
          console.warn("Cloud data restore failed; TrackFit will use its local cache.", hydrateError);
        }
      } else {
        CheckInRepository.setActiveUser(null);
        HistoryRepository.setActiveUser(null);
      }

      if (mounted) setLoading(false);
    }

    void restoreSession();

    // Re-attempt completed-workout uploads after connectivity returns.
    // Pending sessions stay in their original account cache until confirmed.
    const retryWhenOnline = () => {
      if (!navigator.onLine) return;
      void HistoryRepository.retryPending().catch((error) =>
        console.warn("Completed workout sync will retry at next sign-in.", error));
    };
    window.addEventListener("online", retryWhenOnline);

    const { data } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;
      setLoading(true);
      setSession(nextSession);
      setAuthError("");

      if (nextSession) {
        CheckInRepository.setActiveUser(nextSession.user.id);
        HistoryRepository.setActiveUser(nextSession.user.id);
        try {
          await Promise.all([
            WorkoutCloudRepository.getAll(),
            TrainingCloudRepository.hydrate(),
            CheckInRepository.hydrateForUser(nextSession.user.id),
          ]);
        } catch (hydrateError) {
          console.warn("Cloud data restore failed; TrackFit will use its local cache.", hydrateError);
        }
      } else {
        CheckInRepository.setActiveUser(null);
        HistoryRepository.setActiveUser(null);
      }

      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      window.removeEventListener("online", retryWhenOnline);
      data.subscription.unsubscribe();
    };
  }, []);

  if (!isSupabaseConfigured) {
    return <main className="screen" style={{ display: "grid", placeItems: "center", minHeight: "100vh", padding: 24 }}><section style={{ maxWidth: 460, textAlign: "center" }}><h1>TrackFit cloud setup missing</h1><p>Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local, then restart the development server.</p></section></main>;
  }

  if (loading) return <main className="screen"><p>Loading TrackFit...</p></main>;

  if (authError) {
    return <main className="screen" style={{ display: "grid", placeItems: "center", minHeight: "100vh", padding: 24 }}><section style={{ maxWidth: 460, textAlign: "center" }}><h1>Could not restore your login</h1><p>{authError}</p><p>Refresh the page or sign in again.</p></section></main>;
  }

  if (!session) return <AuthScreen />;
  return children;
}

import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../../services/supabase";
import { WorkoutCloudRepository } from "../../services/repositories/workoutCloudRepository";
import { CardioCloudRepository } from "../../services/repositories/cardioCloudRepository";
import { NutritionCloudRepository } from "../../services/repositories/nutritionCloudRepository";
import { TrainingCloudRepository } from "../../services/repositories/trainingCloudRepository";
import { CheckInRepository, HistoryRepository, CardioRepository, NutritionRepository } from "../../services/repositories/trackfitDataLayer";
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
        CardioRepository.setActiveUser(restoredSession.user.id);
        NutritionRepository.setActiveUser(restoredSession.user.id);
        window.setTimeout(() => {
          if (!mounted || NutritionRepository.getActiveUser() !== restoredSession.user.id) return;
          void NutritionCloudRepository.retryPending().catch(error =>
            console.warn("Food backup will retry when connected.", error));
        }, 0);
        try {
          await Promise.all([
            WorkoutCloudRepository.getAll(),
            CardioCloudRepository.getAll(),
            TrainingCloudRepository.hydrate(),
            CheckInRepository.hydrateForUser(restoredSession.user.id),
          ]);
        } catch (hydrateError) {
          console.warn("Cloud data restore failed; TrackFit will use its local cache.", hydrateError);
        }
      } else {
        CheckInRepository.setActiveUser(null);
        HistoryRepository.setActiveUser(null);
        CardioRepository.setActiveUser(null);
        NutritionRepository.setActiveUser(null);
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
      void CardioCloudRepository.retryPending().catch((error) =>
        console.warn("Cardio sync will retry on next sign-in.", error));
      void NutritionCloudRepository.retryPending().catch((error) =>
        console.warn("Food sync will retry on next sign-in.", error));
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
        CardioRepository.setActiveUser(nextSession.user.id);
        NutritionRepository.setActiveUser(nextSession.user.id);
        window.setTimeout(() => {
          if (!mounted || NutritionRepository.getActiveUser() !== nextSession.user.id) return;
          void NutritionCloudRepository.retryPending().catch(error =>
            console.warn("Food backup will retry when connected.", error));
        }, 0);
        try {
          await Promise.all([
            WorkoutCloudRepository.getAll(),
            CardioCloudRepository.getAll(),
            TrainingCloudRepository.hydrate(),
            CheckInRepository.hydrateForUser(nextSession.user.id),
          ]);
        } catch (hydrateError) {
          console.warn("Cloud data restore failed; TrackFit will use its local cache.", hydrateError);
        }
      } else {
        CheckInRepository.setActiveUser(null);
        HistoryRepository.setActiveUser(null);
        CardioRepository.setActiveUser(null);
        NutritionRepository.setActiveUser(null);
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

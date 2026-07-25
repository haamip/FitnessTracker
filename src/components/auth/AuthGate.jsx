import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../../services/supabase";
import AuthScreen from "./AuthScreen";

export default function AuthGate({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return undefined;

    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;

      if (error) {
        setAuthError(error.message || "Unable to restore your TrackFit session.");
      }

      setSession(data?.session || null);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setAuthError("");
      setLoading(false);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  if (!isSupabaseConfigured) {
    return (
      <main className="screen" style={{ display: "grid", placeItems: "center", minHeight: "100vh", padding: 24 }}>
        <section style={{ maxWidth: 460, textAlign: "center" }}>
          <h1>TrackFit cloud setup missing</h1>
          <p>
            Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local, then restart the development server.
          </p>
        </section>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="screen">
        <p>Loading TrackFit...</p>
      </main>
    );
  }

  if (authError) {
    return (
      <main className="screen" style={{ display: "grid", placeItems: "center", minHeight: "100vh", padding: 24 }}>
        <section style={{ maxWidth: 460, textAlign: "center" }}>
          <h1>Could not restore your login</h1>
          <p>{authError}</p>
          <p>Refresh the page or sign in again.</p>
        </section>
      </main>
    );
  }

  if (!session) return <AuthScreen />;
  return children;
}

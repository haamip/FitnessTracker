import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../../services/supabase";
import AuthScreen from "./AuthScreen";

export default function AuthGate({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return undefined;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) return children;
  if (loading) return <main className="screen"><p>Loading TrackFit...</p></main>;
  if (!session) return <AuthScreen />;
  return children;
}

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase, isConfigured } from "../lib/supabase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(isConfigured);
  const [recovery, setRecovery] = useState(false);

  const loadProfile = useCallback(async (user) => {
    if (!user) { setProfile(null); return; }
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    setProfile(data || null);
  }, []);

  useEffect(() => {
    if (!isConfigured) return undefined;
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await loadProfile(data.session?.user);
      if (active) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      // defer DB work outside the auth callback (recommended by Supabase)
      setTimeout(() => loadProfile(next?.user), 0);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, [loadProfile]);

  const value = useMemo(() => {
    const user = session?.user || null;
    const role = profile?.role || "student";
    return {
      session, user, profile, loading, recovery,
      isAdmin: role === "admin",
      isInstructor: role === "instructor" || role === "admin",
      clearRecovery: () => setRecovery(false),
      refreshProfile: () => loadProfile(user),
      signOut: () => supabase.auth.signOut(),
    };
  }, [session, profile, loading, recovery, loadProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/app/living-site/lib/supabaseClient";
import { getProfileSummary, type ProfileRole, upsertCustomerProfile } from "@/app/living-site/lib/data";

type AuthIntentRole = "customer" | "agent";

type AppStateValue = {
  user: User | null;
  authToken: string | null;
  profileRole: ProfileRole | null;
  profileReady: boolean;
  loading: boolean;
  login: (email: string, password: string, expectedRole?: AuthIntentRole) => Promise<{ error?: string; role?: ProfileRole | null }>
  register: (
    email: string,
    password: string,
    profile?: { name: string; contactNumber: string; role?: ProfileRole }
  ) => Promise<{ error?: string; user?: User; role?: ProfileRole | null }>
  logout: () => Promise<void>;
};

const AppStateContext = createContext<AppStateValue>({
  user: null,
  authToken: null,
  profileRole: null,
  profileReady: false,
  loading: true,
  login: async () => ({ error: "Not initialized." }),
  register: async () => ({ error: "Not initialized." }),
  logout: async () => {},
});

async function ensureCustomerProfile(user: User) {
  if (!isSupabaseConfigured) return;
  await upsertCustomerProfile({
    id: user.id,
    email: user.email ?? null,
  });
}

async function getResolvedProfileRole(userId: string) {
  const { profile } = await getProfileSummary(userId);
  return profile?.role ?? null;
}

function isRoleAllowed(expectedRole: AuthIntentRole | undefined, actualRole: ProfileRole | null) {
  if (!expectedRole) return true;
  if (expectedRole === "agent") {
    return actualRole === "vendor_user";
  }
  return actualRole !== "vendor_user";
}

function getRoleMismatchMessage(expectedRole: AuthIntentRole | undefined, actualRole: ProfileRole | null) {
  if (!expectedRole) return "This account does not match the selected access path.";
  if (expectedRole === "agent") {
    return "This account is not registered as an agent. Use customer sign in instead.";
  }
  if (actualRole === "vendor_user") {
    return "This account is registered as an agent. Use agent sign in instead.";
  }
  return "This account does not match the selected access path.";
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [profileRole, setProfileRole] = useState<ProfileRole | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setProfileReady(true);
      setLoading(false);
      return;
    }

    let mounted = true;

    const hydrate = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session ?? null;
      const { data: userData } = await supabase.auth.getUser();
      const resolvedUser = userData.user ?? session?.user ?? null;
      const resolvedRole = resolvedUser ? await getResolvedProfileRole(resolvedUser.id) : null;

      if (!mounted) return;

      setUser(resolvedUser);
      setAuthToken(session?.access_token ?? null);
      setProfileRole(resolvedRole);
      setProfileReady(true);
      setLoading(false);

      if (resolvedUser) {
        void ensureCustomerProfile(resolvedUser);
      }
    };

    hydrate();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        setUser(session?.user ?? null);
        setAuthToken(session?.access_token ?? null);
        setProfileReady(false);
        setLoading(false);
        if (session?.user) {
          void ensureCustomerProfile(session.user);
          const resolvedRole = await getResolvedProfileRole(session.user.id);
          if (!mounted) return;
          setProfileRole(resolvedRole);
          setProfileReady(true);
        } else {
          setProfileRole(null);
          setProfileReady(true);
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string, expectedRole?: AuthIntentRole) => {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is not configured." };
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { error: error.message };
      }

      const signedInUser = data.user;
      const resolvedRole = signedInUser ? await getResolvedProfileRole(signedInUser.id) : null;

      if (!isRoleAllowed(expectedRole, resolvedRole)) {
        await supabase.auth.signOut();
        return { error: getRoleMismatchMessage(expectedRole, resolvedRole), role: resolvedRole };
      }

      return { role: resolvedRole };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to reach the authentication service.";
      return { error: message || "Unable to reach the authentication service." };
    }
  };

  const register = async (
    email: string,
    password: string,
    profile?: { name: string; contactNumber: string; role?: ProfileRole }
  ) => {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is not configured." };
    }
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        return { error: error.message };
      }
      if (data.user) {
        await upsertCustomerProfile({
          id: data.user.id,
          email: data.user.email ?? email,
          name: profile?.name,
          contactNumber: profile?.contactNumber,
          role: profile?.role,
        });
      }
      return { user: data.user ?? undefined, role: profile?.role ?? null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to reach the authentication service.";
      return { error: message || "Unable to reach the authentication service." };
    }
  };

  const logout = async () => {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.auth.signOut();
    } catch {
      // Swallow network logout errors to avoid breaking the UI.
    }
  };

  const value = useMemo(
    () => ({ user, authToken, profileRole, profileReady, loading, login, register, logout }),
    [user, authToken, profileRole, profileReady, loading]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  return useContext(AppStateContext);
}

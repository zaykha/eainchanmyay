"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/app/living-site/lib/supabaseClient";
import { upsertCustomerProfile } from "@/app/living-site/lib/data";

type AppStateValue = {
  user: User | null;
  authToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>
  register: (
    email: string,
    password: string,
    profile?: { name: string; contactNumber: string }
  ) => Promise<{ error?: string; user?: User }>
  logout: () => Promise<void>;
};

const AppStateContext = createContext<AppStateValue>({
  user: null,
  authToken: null,
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

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const hydrate = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session ?? null;
      const { data: userData } = await supabase.auth.getUser();

      if (!mounted) return;

      setUser(userData.user ?? session?.user ?? null);
      setAuthToken(session?.access_token ?? null);
      setLoading(false);

      if (userData.user) {
        void ensureCustomerProfile(userData.user);
      }
    };

    hydrate();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        setUser(session?.user ?? null);
        setAuthToken(session?.access_token ?? null);
        setLoading(false);
        if (session?.user) {
          void ensureCustomerProfile(session.user);
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is not configured." };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : {};
  };

  const register = async (
    email: string,
    password: string,
    profile?: { name: string; contactNumber: string }
  ) => {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is not configured." };
    }
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
      });
    }
    return { user: data.user ?? undefined };
  };

  const logout = async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
  };

  const value = useMemo(
    () => ({ user, authToken, loading, login, register, logout }),
    [user, authToken, loading]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  return useContext(AppStateContext);
}

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

async function syncProfileOnServer(input: {
  authToken: string;
  email?: string | null;
  name?: string | null;
  contactNumber?: string | null;
  role?: ProfileRole;
}) {
  const response = await fetch("/api/auth/sync-profile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.authToken}`,
    },
    body: JSON.stringify({
      email: input.email ?? null,
      full_name: input.name ?? null,
      phone: input.contactNumber ?? null,
      role: input.role ?? null,
    }),
  });

  const payload = (await response.json().catch(() => null)) as { error?: string } | null;

  if (!response.ok) {
    return { ok: false, message: payload?.error || "Unable to sync account profile." };
  }

  return { ok: true };
}

async function ensureCustomerProfile(user: User, authToken?: string | null) {
  if (!isSupabaseConfigured) return;
  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : null;
  const metadataPhone =
    typeof user.user_metadata?.contact_number === "string"
      ? user.user_metadata.contact_number
      : typeof user.user_metadata?.phone === "string"
        ? user.user_metadata.phone
        : null;
  const metadataRole =
    typeof user.user_metadata?.role === "string" ? (user.user_metadata.role as ProfileRole) : undefined;

  if (authToken) {
    const syncResult = await syncProfileOnServer({
      authToken,
      email: user.email ?? null,
      name: metadataName,
      contactNumber: metadataPhone,
      role: metadataRole,
    });

    if (syncResult.ok) {
      return;
    }
  }

  await upsertCustomerProfile({
    id: user.id,
    email: user.email ?? null,
    name: metadataName,
    contactNumber: metadataPhone,
    role: metadataRole,
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
      const resolvedUser = session?.user ?? null;
      const resolvedRole = resolvedUser ? await getResolvedProfileRole(resolvedUser.id) : null;

      if (!mounted) return;

      setUser(resolvedUser);
      setAuthToken(session?.access_token ?? null);
      setProfileRole(resolvedRole);
      setProfileReady(true);
      setLoading(false);

      if (resolvedUser) {
        void ensureCustomerProfile(resolvedUser, session?.access_token ?? null);
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
          void ensureCustomerProfile(session.user, session.access_token ?? null);
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: profile?.name?.trim() || null,
            name: profile?.name?.trim() || null,
            contact_number: profile?.contactNumber?.trim() || null,
            phone: profile?.contactNumber?.trim() || null,
            role: profile?.role ?? "user",
          },
        },
      });
      if (error) {
        return { error: error.message };
      }
      if (data.user) {
        const authToken = data.session?.access_token ?? null;
        const profileResult = authToken
          ? await syncProfileOnServer({
              authToken,
              email: data.user.email ?? email,
              name: profile?.name ?? null,
              contactNumber: profile?.contactNumber ?? null,
              role: profile?.role,
            })
          : await upsertCustomerProfile({
              id: data.user.id,
              email: data.user.email ?? email,
              name: profile?.name,
              contactNumber: profile?.contactNumber,
              role: profile?.role,
            });
        if (!profileResult.ok) {
          return { error: profileResult.message || "Unable to save account profile." };
        }
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

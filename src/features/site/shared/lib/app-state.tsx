"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/features/site/shared/lib/supabaseClient";
import { getProfileSummary, type ProfileRole, upsertCustomerProfile } from "@/features/site/shared/lib/data";

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

type CachedProfileSummary = {
  role: ProfileRole | null;
  cachedAt: number;
};

const PROFILE_CACHE_PREFIX = "ecm_profile_summary_v1";
const PROFILE_CACHE_TTL_MS = 10 * 60 * 1000;

function getProfileCacheKey(userId: string) {
  return `${PROFILE_CACHE_PREFIX}:${userId}`;
}

function readCachedProfileSummary(userId: string): CachedProfileSummary | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(getProfileCacheKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedProfileSummary;
    if (typeof parsed?.cachedAt !== "number") return null;
    if (Date.now() - parsed.cachedAt > PROFILE_CACHE_TTL_MS) return null;
    return {
      role: parsed.role ?? null,
      cachedAt: parsed.cachedAt,
    };
  } catch {
    return null;
  }
}

function writeCachedProfileSummary(userId: string, role: ProfileRole | null) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      getProfileCacheKey(userId),
      JSON.stringify({ role, cachedAt: Date.now() } satisfies CachedProfileSummary)
    );
  } catch {
    // Ignore localStorage failures.
  }
}

function clearClientAuthCaches() {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key) continue;
      if (
        key.startsWith("ecm_profile_summary_v1:") ||
        key.startsWith("ecm_viewing_contact_cache:") ||
        key.startsWith("ecm_account_tab_cache_") ||
        key.startsWith("ecm_account_tab_cache_v2:") ||
        key.startsWith("ecm_vendor_workspace_cache:") ||
        key.startsWith("ecm_active_vendor_workspace_v1:") ||
        key === "kaiten_vendor_onboarding_pending" ||
        key === "kaiten_living_auth_resume" ||
        key === "kaiten_agent_registering"
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Ignore localStorage failures during logout cleanup.
  }
}

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

async function getResolvedProfileRole(
  userId: string,
  email?: string | null,
  metadataRole?: ProfileRole | null
) {
  if (metadataRole === "vendor_user") {
    return "vendor_user";
  }

  if (email) {
    try {
      const response = await fetch("/api/auth/check-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            role?: ProfileRole | null;
            found?: boolean;
          }
        | null;
      if (response.ok && payload?.found) {
        return payload.role ?? metadataRole ?? null;
      }
    } catch {
      // Fall back to client profile lookup below.
    }
  }

  const { profile } = await getProfileSummary(userId);
  return metadataRole ?? profile?.role ?? null;
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

      if (!mounted) return;

      setUser(resolvedUser);
      setAuthToken(session?.access_token ?? null);
      const metadataRole =
        typeof resolvedUser?.user_metadata?.role === "string"
          ? (resolvedUser.user_metadata.role as ProfileRole)
          : null;
      const cachedSummary = resolvedUser ? readCachedProfileSummary(resolvedUser.id) : null;
      const optimisticRole = cachedSummary?.role ?? metadataRole ?? null;

      setProfileRole(optimisticRole);
      setProfileReady(Boolean(!resolvedUser || cachedSummary || metadataRole));
      setLoading(false);

      if (resolvedUser) {
        void getResolvedProfileRole(
          resolvedUser.id,
          resolvedUser.email ?? null,
          metadataRole
        ).then((resolvedRole) => {
          if (!mounted) return;
          setProfileRole(resolvedRole);
          setProfileReady(true);
          writeCachedProfileSummary(resolvedUser.id, resolvedRole);
        });
      } else {
        setProfileReady(true);
      }

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
        setLoading(false);
        if (session?.user) {
          const metadataRole =
            typeof session.user.user_metadata?.role === "string"
              ? (session.user.user_metadata.role as ProfileRole)
              : null;
          const cachedSummary = readCachedProfileSummary(session.user.id);
          setProfileRole(cachedSummary?.role ?? metadataRole ?? null);
          setProfileReady(Boolean(cachedSummary || metadataRole));
          void ensureCustomerProfile(session.user, session.access_token ?? null);
          const resolvedRole = await getResolvedProfileRole(
            session.user.id,
            session.user.email ?? null,
            metadataRole
          );
          if (!mounted) return;
          setProfileRole(resolvedRole);
          setProfileReady(true);
          writeCachedProfileSummary(session.user.id, resolvedRole);
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
      const metadataRole =
        typeof signedInUser?.user_metadata?.role === "string"
          ? (signedInUser.user_metadata.role as ProfileRole)
          : null;
      const resolvedRole = signedInUser
        ? await getResolvedProfileRole(signedInUser.id, signedInUser.email ?? null, metadataRole)
        : null;

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
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/confirm?role=${profile?.role === "vendor_user" ? "agent" : "customer"}`
              : undefined,
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
    setUser(null);
    setAuthToken(null);
    setProfileRole(null);
    setProfileReady(true);
    setLoading(false);
    clearClientAuthCaches();
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

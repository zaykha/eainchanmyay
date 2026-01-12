import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const cookieStorage = {
  getItem: (key: string) => {
    if (typeof document === "undefined") return null;
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${key}=`));
    return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
  },
  setItem: (key: string, value: string) => {
    if (typeof document === "undefined") return;
    const isSecure = window.location.protocol === "https:";
    document.cookie = `${key}=${encodeURIComponent(
      value
    )}; path=/; max-age=2592000; samesite=lax${isSecure ? "; secure" : ""}`;
  },
  removeItem: (key: string) => {
    if (typeof document === "undefined") return;
    const isSecure = window.location.protocol === "https:";
    document.cookie = `${key}=; path=/; max-age=0; samesite=lax${isSecure ? "; secure" : ""}`;
  },
};

export const supabase = createClientComponentClient({
  supabaseUrl,
  supabaseKey: supabaseAnonKey,
  options: {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: cookieStorage,
    },
  },
});

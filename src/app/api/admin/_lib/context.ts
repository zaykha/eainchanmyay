import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const isConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length).trim() || null;
}

export type AdminRequestContext = {
  supabase: SupabaseClient;
  user: { id: string; email?: string | null };
  profile: {
    id: string;
    role: string | null;
    full_name: string | null;
    email: string | null;
  };
};

export async function getAdminRequestContext(request: Request): Promise<
  | { ok: true; context: AdminRequestContext }
  | { ok: false; response: NextResponse }
> {
  if (!isConfigured) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Supabase is not configured." }, { status: 500 }),
    };
  }

  const token = getBearerToken(request);
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Missing authorization token." }, { status: 401 }),
    };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  const user = userData.user;
  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id,role,full_name,email")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profileData) {
    return {
      ok: false,
      response: NextResponse.json({ error: profileError?.message ?? "Profile not found." }, { status: 403 }),
    };
  }

  if (profileData.role !== "admin" && profileData.role !== "master_admin") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Only platform admins can access this route." }, { status: 403 }),
    };
  }

  return {
    ok: true,
    context: {
      supabase,
      user: {
        id: user.id,
        email: user.email ?? null,
      },
      profile: {
        id: String(profileData.id),
        role: (profileData.role as string | null) ?? null,
        full_name: (profileData.full_name as string | null) ?? null,
        email: (profileData.email as string | null) ?? null,
      },
    },
  };
}

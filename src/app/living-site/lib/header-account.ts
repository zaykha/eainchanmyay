import type { ProfileRole } from "@/app/living-site/lib/data";

type HeaderAccountState = {
  user: { email?: string | null } | null;
  profileRole: ProfileRole | null;
  profileReady: boolean;
  loading: boolean;
};

export function resolveHeaderAccountPresentation({
  user,
  profileRole,
  profileReady,
  loading,
}: HeaderAccountState) {
  if (!user) {
    return {
      label: "Sign in / Register",
      href: "/auth",
    };
  }

  if (profileReady && profileRole === "vendor_user") {
    return {
      label: "Hub",
      href: "/hub",
    };
  }

  if (loading || !profileReady) {
    return {
      label: "Account",
      href: "/account",
    };
  }

  return {
    label: "Account",
    href: "/account",
  };
}

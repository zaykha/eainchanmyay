"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import { supabase, isSupabaseConfigured } from "@/features/site/shared/lib/supabaseClient";
import { LoadingOverlay } from "@/features/site/shared/components/LoadingOverlay";
import { AGENT_ONBOARDING_STORAGE_KEY } from "@/features/site/shared/components/AuthScreen";

const Page = styled.main`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: var(--color-paper);
`;

const Card = styled.div`
  width: min(520px, 100%);
  border: 1px solid var(--color-outline);
  border-radius: 24px;
  background: var(--color-surface);
  box-shadow: var(--shadow-soft);
  padding: 24px;
  display: grid;
  gap: 14px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.5rem;
`;

const Copy = styled.p`
  margin: 0;
  color: var(--color-muted);
  line-height: 1.6;
`;

const Action = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  width: fit-content;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface);
  color: var(--color-text);
  font-weight: 700;
  text-decoration: none;
`;

export default function AuthConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError("Supabase is not configured.");
      return;
    }

    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");
    const role = searchParams.get("role");

    if (!tokenHash || !type) {
      setError("This confirmation link is incomplete or has expired.");
      return;
    }

    let active = true;

    const completeConfirmation = async () => {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email",
      });

      if (verifyError) {
        if (active) setError(verifyError.message || "Unable to confirm this email.");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (role === "agent" && session?.access_token) {
        await fetch("/api/auth/ensure-vendor-role", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }).catch(() => null);

        if (typeof window !== "undefined") {
          window.localStorage.setItem(AGENT_ONBOARDING_STORAGE_KEY, "1");
        }
        router.replace("/vendor-setup");
        return;
      }

      router.replace("/account");
    };

    void completeConfirmation();

    return () => {
      active = false;
    };
  }, [router, searchParams]);

  if (error) {
    return (
      <Page>
        <Card>
          <Title>Confirmation issue</Title>
          <Copy>{error}</Copy>
          <Action href="/auth">Back to sign in</Action>
        </Card>
      </Page>
    );
  }

  return <LoadingOverlay message="Confirming your email…" />;
}

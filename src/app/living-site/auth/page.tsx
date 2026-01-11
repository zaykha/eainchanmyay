"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";
import { Panel } from "@/app/living-site/components/PageSection";
import { isSupabaseConfigured } from "@/app/living-site/lib/supabaseClient";
import { useAppState } from "@/app/living-site/lib/app-state";
import { AuthScreen } from "@/app/living-site/components/AuthScreen";
import { useRouter } from "next/navigation";

const Centered = styled.main`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 16px;
  position: relative;
`;

const AuthCard = styled(Panel)`
  width: min(420px, 100%);
  display: grid;
  gap: 12px;
  background: var(--color-surface-2);
`;

const BackButton = styled.button`
  position: absolute;
  top: 16px;
  left: 16px;
  border: 1px solid var(--color-outline);
  border-radius: 999px;
  padding: 8px 12px;
  background: var(--color-surface-2);
  color: var(--color-text);
  cursor: pointer;
  font-weight: 600;
  box-shadow: var(--frame-shadow);
`;

const SecondaryButton = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: var(--radius-md);
  padding: 12px 18px;
  background: var(--color-surface-2);
  color: var(--color-text);
  cursor: pointer;
  box-shadow: var(--frame-shadow);
  transition: transform 0.15s ease;

  &:active {
    transform: translate(2px, 2px);
  }
`;

const Message = styled.p`
  color: var(--color-muted);
`;

export default function AuthPage() {
  const { user, logout } = useAppState();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [resumePath, setResumePath] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("kaiten_living_auth_resume");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as { resumePath?: string } | null;
      if (parsed?.resumePath) {
        setResumePath(parsed.resumePath);
      }
    } catch {
      setResumePath(null);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const target = resumePath || "/";
    setRedirecting(true);
    router.replace(target);
  }, [resumePath, router, user]);

  return (
    <Centered>
      <BackButton type="button" onClick={() => router.back()}>
        Back
      </BackButton>
      <AuthCard>
        {!isSupabaseConfigured && (
          <Message>
            Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to
            enable auth.
          </Message>
        )}
        {user ? (
          <div>
            <p>{redirecting ? "Redirecting..." : "Signing you in..."}</p>
            <SecondaryButton
              type="button"
              onClick={async () => {
                await logout();
                setMessage("Signed out.");
              }}
            >
              Sign out
            </SecondaryButton>
          </div>
        ) : (
          <AuthScreen
            onSuccess={() => {
              if (typeof window !== "undefined") {
                window.localStorage.removeItem("kaiten_living_auth_resume");
              }
              router.replace(resumePath || "/");
            }}
          />
        )}
        {message && <Message>{message}</Message>}
      </AuthCard>
    </Centered>
  );
}

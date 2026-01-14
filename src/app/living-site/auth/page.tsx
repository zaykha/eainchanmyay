"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";
import { Panel } from "@/app/living-site/components/PageSection";
import { isSupabaseConfigured } from "@/app/living-site/lib/supabaseClient";
import { useAppState } from "@/app/living-site/lib/app-state";
import { AuthScreen } from "@/app/living-site/components/AuthScreen";
import { useRouter } from "next/navigation";
import { useI18n } from "@/app/living-site/lib/i18n";

const Centered = styled.main`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px 16px;
  position: relative;
`;

const AuthCard = styled(Panel)`
  width: min(460px, 100%);
  display: grid;
  gap: 18px;
  background: var(--color-surface-2);
  padding: 26px;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: -40%;
    background: radial-gradient(
      circle,
      color-mix(in srgb, var(--color-primary) 18%, transparent),
      transparent 60%
    );
    opacity: 0.5;
    pointer-events: none;
  }
`;

const BackButton = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: 12px;
  padding: 8px 12px;
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
  font-weight: 600;
  box-shadow: var(--frame-shadow);
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  position: relative;
  z-index: 1;
`;

const CardBody = styled.div`
  display: grid;
  gap: 16px;
  position: relative;
  z-index: 1;
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
  const { t } = useI18n();
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

  useEffect(() => {
    if (typeof document === "undefined") return;
    const previousPadding = document.body.style.paddingBottom;
    document.body.style.paddingBottom = "0px";
    return () => {
      document.body.style.paddingBottom = previousPadding;
    };
  }, []);

  return (
    <Centered>
      <AuthCard>
        <CardHeader>
          <BackButton type="button" onClick={() => router.back()}>
            {t("auth.back")}
          </BackButton>
        </CardHeader>
        <CardBody>
          {!isSupabaseConfigured && (
            <Message>
              {t("auth.supabaseMissing")}
            </Message>
          )}
          {user ? (
            <div>
              <p>{redirecting ? t("auth.redirecting") : t("auth.signingIn")}</p>
              <SecondaryButton
                type="button"
                onClick={async () => {
                  await logout();
                  setMessage(t("auth.signedOut"));
                }}
              >
                {t("common.signOut")}
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
        </CardBody>
      </AuthCard>
    </Centered>
  );
}

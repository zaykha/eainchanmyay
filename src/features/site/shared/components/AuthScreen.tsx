"use client";

import { useState } from "react";
import styled from "styled-components";
import { useAppState } from "@/features/site/shared/lib/app-state";
import { supabase, isSupabaseConfigured } from "@/features/site/shared/lib/supabaseClient";
import { LoadingOverlay } from "@/features/site/shared/components/LoadingOverlay";
import { useI18n } from "@/features/site/shared/lib/i18n";
import type { ProfileRole } from "@/features/site/shared/lib/data";

const Wrapper = styled.div`
  display: grid;
  gap: 18px;

  @media (max-width: 720px) {
    gap: 14px;
  }
`;

const Header = styled.div`
  display: grid;
  gap: 10px;

  @media (max-width: 720px) {
    gap: 8px;
  }
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

const SwitchRoleButton = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: 999px;
  padding: 8px 12px;
  background: #fff;
  color: var(--color-text);
  font-weight: 600;
  cursor: pointer;

  @media (max-width: 720px) {
    padding: 7px 11px;
    font-size: 0.82rem;
  }
`;

const RoleBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(235, 35, 64, 0.08);
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;

  @media (max-width: 720px) {
    padding: 6px 10px;
    font-size: 0.7rem;
  }
`;

const Title = styled.h2`
  margin: 0;
  font-size: 2rem;
  line-height: 0.95;

  @media (min-width: 721px) {
    margin-bottom: 8px;
  }

  @media (max-width: 720px) {
    font-size: 1.32rem;
    line-height: 1.02;
    margin-bottom: 6px;
  }
`;

const Subtitle = styled.p`
  margin: 0;
  color: var(--color-muted);
  font-size: 0.95rem;
  line-height: 1.55;

  @media (max-width: 720px) {
    font-size: 0.88rem;
    line-height: 1.45;
  }
`;

const Tabs = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 16px;
  background: color-mix(in srgb, var(--color-surface-2) 88%, transparent);
  overflow: hidden;

  @media (max-width: 720px) {
    border-radius: 14px;
  }
`;

const TabButton = styled.button<{ $active: boolean }>`
  border: none;
  background: ${(props) => (props.$active ? "var(--gradient)" : "transparent")};
  color: ${(props) => (props.$active ? "#fff" : "var(--color-text)")};
  padding: 13px 14px;
  cursor: pointer;
  font-weight: 700;

  @media (max-width: 720px) {
    padding: 11px 10px;
    font-size: 0.9rem;
  }
`;

const Form = styled.form`
  display: grid;
  gap: 12px;

  @media (max-width: 720px) {
    gap: 10px;
  }
`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.label<{ $filled: boolean }>`
  position: relative;
  display: grid;
  gap: 6px;

  &[data-filled="true"] .floating-label,
  &:focus-within .floating-label {
    transform: translateY(-14px) scale(0.9);
    color: var(--color-primary);
  }
`;

const FloatingLabel = styled.span`
  position: absolute;
  left: 12px;
  top: 10px;
  font-size: 0.75rem;
  color: color-mix(in srgb, var(--color-muted) 80%, transparent);
  background: #fff;
  padding: 0 4px;
  transition: transform 0.15s ease, color 0.15s ease;
  transform-origin: left center;

  @media (max-width: 720px) {
    top: 9px;
    font-size: 0.72rem;
  }
`;

const Input = styled.input`
  border-radius: 14px;
  border: 1px solid var(--color-outline);
  padding: 16px 12px 10px;
  background: #fff;
  color: var(--color-text);
  min-height: 52px;

  @media (max-width: 720px) {
    min-height: 48px;
    padding: 15px 12px 9px;
  }
`;

const PrimaryButton = styled.button`
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 999px;
  padding: 14px 18px;
  background: var(--gradient);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 18px 30px rgba(235, 35, 64, 0.2);

  @media (max-width: 720px) {
    padding: 13px 16px;
  }
`;

const SecondaryButton = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: 999px;
  padding: 13px 16px;
  background: #fff;
  color: var(--color-text);
  cursor: pointer;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  @media (max-width: 720px) {
    padding: 12px 14px;
  }
`;

const GoogleMark = styled.svg`
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
`;

const InlineHelp = styled.p`
  margin: 0;
  color: var(--color-muted);
  font-size: 0.88rem;
  text-align: center;

  @media (max-width: 720px) {
    font-size: 0.82rem;
  }
`;

const Message = styled.p`
  color: var(--color-muted);
  margin: 0;
`;

const PopupOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.34);
`;

const PopupCard = styled.div`
  width: min(460px, 100%);
  border-radius: 24px;
  padding: 22px;
  background: #fff;
  box-shadow: 0 26px 70px rgba(15, 23, 42, 0.18);
  display: grid;
  gap: 14px;
`;

const PopupTitle = styled.h3`
  margin: 0;
  font-size: 1.15rem;
  color: var(--color-text);
`;

const PopupText = styled.p`
  margin: 0;
  color: var(--color-muted);
  line-height: 1.6;
`;

const PopupActions = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const StrengthList = styled.div`
  display: grid;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--color-muted);
`;

const StrengthItem = styled.div<{ $active: boolean }>`
  display: grid;
  grid-template-columns: 16px 1fr;
  align-items: center;
  gap: 8px;
  color: ${(props) => (props.$active ? "var(--color-text)" : "var(--color-muted)")};
`;

const StrengthDot = styled.span<{ $active: boolean }>`
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 1px solid var(--color-outline);
  background: ${(props) => (props.$active ? "var(--color-primary)" : "transparent")};
`;

type Mode = "login" | "register";
export type AuthRole = "customer" | "agent";
export const AGENT_ONBOARDING_STORAGE_KEY = "kaiten_vendor_onboarding_pending";
export const AGENT_REGISTERING_STORAGE_KEY = "kaiten_vendor_registering";

export type AuthSuccessPayload = {
  role: ProfileRole | null;
  mode: Mode;
};

type AuthScreenProps = {
  role: AuthRole;
  onSuccess?: (payload: AuthSuccessPayload) => void;
  onChangeRole?: () => void;
};

function GoogleIcon() {
  return (
    <GoogleMark viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.87c2.26-2.09 3.57-5.16 3.57-8.64Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.87-3c-1.07.72-2.44 1.15-4.08 1.15-3.14 0-5.8-2.12-6.75-4.97H1.26v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.25 14.27A7.2 7.2 0 0 1 4.87 12c0-.79.14-1.56.38-2.27V6.64H1.26A12 12 0 0 0 0 12c0 1.94.46 3.78 1.26 5.36l3.99-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.61 4.58 1.8l3.43-3.43C17.95 1.14 15.23 0 12 0A12 12 0 0 0 1.26 6.64l3.99 3.09C6.2 6.88 8.86 4.77 12 4.77Z"
      />
    </GoogleMark>
  );
}

async function precheckPortalRole(email: string) {
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
        debug?: {
          profileId?: string | null;
          profileRole?: string | null;
          effectiveRole?: string | null;
          hasActiveVendorMembership?: boolean;
        } | null;
        error?: string;
      }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error || "AUTH_VERIFY_ROLE");
  }

  return {
    role: payload?.role ?? null,
    found: Boolean(payload?.found),
    debug: payload?.debug ?? null,
  };
}

export function AuthScreen({ role, onSuccess, onChangeRole }: AuthScreenProps) {
  const { login, register } = useAppState();
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

  const passwordChecks = [
    { label: t("auth.passwordCheck.length"), ok: password.length >= 8 },
    { label: t("auth.passwordCheck.lower"), ok: /[a-z]/.test(password) },
    { label: t("auth.passwordCheck.upper"), ok: /[A-Z]/.test(password) },
    { label: t("auth.passwordCheck.number"), ok: /\d/.test(password) },
    { label: t("auth.passwordCheck.special"), ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const passwordStrong = passwordChecks.every((check) => check.ok);

  const roleBadge = role === "agent" ? t("auth.roleBadge.agent") : t("auth.roleBadge.customer");
  const title =
    role === "agent"
      ? mode === "login"
        ? t("auth.title.agentLogin")
        : t("auth.title.agentRegister")
      : mode === "login"
        ? t("auth.title.customerLogin")
        : t("auth.title.customerRegister");
  const subtitle =
    role === "agent"
      ? t("auth.subtitle.agent")
      : t("auth.subtitle.customer");
  const submitLabel =
    mode === "login"
      ? t("auth.signInButton")
      : role === "agent"
        ? t("auth.submitCreateAgent")
        : t("auth.submitCreateAccount");
  const targetProfileRole: ProfileRole = role === "agent" ? "vendor_user" : "user";

  const showError = (nextMessage: string) => {
    setMessage(null);
    setPopupMessage(nextMessage);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setPopupMessage(null);
    if (!isSupabaseConfigured) {
      showError(t("auth.supabaseMissing"));
      return;
    }
    if (mode === "register" && !passwordStrong) {
      showError(t("auth.passwordWeak"));
      return;
    }
    if (mode === "register" && (!fullName.trim() || !phoneNumber.trim())) {
      showError(t("auth.enterNamePhone"));
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const isAgentRegistration = mode === "register" && role === "agent";
    if (typeof window !== "undefined" && isAgentRegistration) {
      window.localStorage.setItem(AGENT_REGISTERING_STORAGE_KEY, "1");
      window.localStorage.setItem(AGENT_ONBOARDING_STORAGE_KEY, "1");
    }
    if (mode === "login") {
      setLoadingMessage(t("auth.signingInShort"));
      try {
        const roleCheck = await precheckPortalRole(normalizedEmail);
        const selectedCustomerPortal = role === "customer";
        const wrongForCustomer = selectedCustomerPortal && roleCheck.found && roleCheck.role === "vendor_user";

        if (wrongForCustomer) {
          const portalMessage = t("auth.popup.accountRegisteredAsAgency");
          setLoadingMessage(null);
          showError(portalMessage);
          return;
        }
      } catch (error) {
        setLoadingMessage(null);
        showError(error instanceof Error ? (error.message === "AUTH_VERIFY_ROLE" ? t("auth.verifyRoleError") : error.message) : t("auth.verifyRoleError"));
        return;
      }
    }
    setLoadingMessage(mode === "login" ? t("auth.signingInShort") : t("auth.creatingAccount"));
    const result =
      mode === "login"
        ? await login(normalizedEmail, password, role)
        : await register(email, password, {
            name: fullName.trim(),
            contactNumber: phoneNumber.trim(),
            role: targetProfileRole,
          });
    setLoadingMessage(null);
    if (result.error) {
      if (typeof window !== "undefined" && isAgentRegistration) {
        window.localStorage.removeItem(AGENT_REGISTERING_STORAGE_KEY);
        window.localStorage.removeItem(AGENT_ONBOARDING_STORAGE_KEY);
      }
      showError(result.error);
      return;
    }
    if (typeof window !== "undefined" && isAgentRegistration) {
      window.localStorage.removeItem(AGENT_REGISTERING_STORAGE_KEY);
    }
    setMessage(mode === "login" ? t("auth.signedIn") : t("auth.checkEmail"));
    onSuccess?.({
      role: result.role ?? targetProfileRole,
      mode,
    });
  };

  const handleGoogle = async () => {
    setMessage(null);
    setPopupMessage(null);
    if (!isSupabaseConfigured) {
      showError(t("auth.supabaseMissing"));
      return;
    }
    setLoadingMessage(t("auth.googleRedirect"));
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });
      if (error) {
        setLoadingMessage(null);
        showError(error.message);
      }
    } catch (error) {
      setLoadingMessage(null);
      showError(error instanceof Error ? error.message : t("auth.unableReachService"));
    }
  };

  return (
    <Wrapper>
      <Header>
        <TopBar>
          <RoleBadge>{roleBadge}</RoleBadge>
          {onChangeRole ? (
            <SwitchRoleButton type="button" onClick={onChangeRole}>
              {t("auth.switchRole")}
            </SwitchRoleButton>
          ) : null}
        </TopBar>
        <div>
          <Title>{title}</Title>
          <Subtitle>{subtitle}</Subtitle>
        </div>
      </Header>

      <Tabs>
        <TabButton type="button" $active={mode === "login"} onClick={() => setMode("login")}>
          {t("auth.login")}
        </TabButton>
        <TabButton type="button" $active={mode === "register"} onClick={() => setMode("register")}>
          {role === "agent" ? t("auth.tabCreateAgent") : t("auth.register")}
        </TabButton>
      </Tabs>

      <Form onSubmit={handleSubmit}>
        {mode === "register" ? (
          <TwoCol>
            <Field $filled={Boolean(fullName)} data-filled={Boolean(fullName)}>
              <FloatingLabel className="floating-label">{t("auth.fullName")}</FloatingLabel>
              <Input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
              />
            </Field>
            <Field $filled={Boolean(phoneNumber)} data-filled={Boolean(phoneNumber)}>
              <FloatingLabel className="floating-label">{t("auth.phoneNumber")}</FloatingLabel>
              <Input
                type="tel"
                inputMode="numeric"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                required
              />
            </Field>
          </TwoCol>
        ) : null}

        <Field $filled={Boolean(email)} data-filled={Boolean(email)}>
          <FloatingLabel className="floating-label">{t("auth.email")}</FloatingLabel>
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Field>

        <Field $filled={Boolean(password)} data-filled={Boolean(password)}>
          <FloatingLabel className="floating-label">{t("auth.password")}</FloatingLabel>
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </Field>

        {mode === "register" && (
          <StrengthList>
            {passwordChecks.map((check) => (
              <StrengthItem key={check.label} $active={check.ok}>
                <StrengthDot $active={check.ok} />
                <span>{check.label}</span>
              </StrengthItem>
            ))}
          </StrengthList>
        )}

        <PrimaryButton type="submit">{submitLabel}</PrimaryButton>

        {role === "customer" ? (
          <>
            <InlineHelp>
              {mode === "login" ? t("auth.newHere") : t("auth.fasterSignIn")}
            </InlineHelp>
            <SecondaryButton type="button" onClick={handleGoogle}>
              <GoogleIcon />
              {t("auth.continueGoogle")}
            </SecondaryButton>
          </>
        ) : (
          <InlineHelp>{t("auth.agentToolsHint")}</InlineHelp>
        )}
      </Form>

      {message && !popupMessage ? <Message>{message}</Message> : null}
      {popupMessage ? (
        <PopupOverlay onClick={() => setPopupMessage(null)}>
          <PopupCard
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="auth-popup-title"
            onClick={(event) => event.stopPropagation()}
          >
            <PopupTitle id="auth-popup-title">{t("auth.popup.signInIssue")}</PopupTitle>
            <PopupText>{popupMessage}</PopupText>
            <PopupActions>
              <SecondaryButton type="button" onClick={() => setPopupMessage(null)}>
                {t("common.close")}
              </SecondaryButton>
            </PopupActions>
          </PopupCard>
        </PopupOverlay>
      ) : null}
      {loadingMessage && <LoadingOverlay message={loadingMessage} />}
    </Wrapper>
  );
}

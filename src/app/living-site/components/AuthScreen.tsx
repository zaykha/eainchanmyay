"use client";

import { useState } from "react";
import styled from "styled-components";
import { useAppState } from "@/app/living-site/lib/app-state";
import { supabase, isSupabaseConfigured } from "@/app/living-site/lib/supabaseClient";
import { LoadingOverlay } from "@/app/living-site/components/LoadingOverlay";
import { useI18n } from "@/app/living-site/lib/i18n";

const Wrapper = styled.div`
  display: grid;
  gap: 18px;
`;

const Header = styled.div`
  display: grid;
  gap: 10px;
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
`;

const Title = styled.h2`
  margin: 0;
  font-size: 2rem;
  line-height: 0.95;

  @media (max-width: 720px) {
    font-size: 1.55rem;
  }
`;

const Subtitle = styled.p`
  margin: 0;
  color: var(--color-muted);
  font-size: 0.95rem;
  line-height: 1.55;
`;

const Tabs = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 16px;
  background: color-mix(in srgb, var(--color-surface-2) 88%, transparent);
  overflow: hidden;
`;

const TabButton = styled.button<{ $active: boolean }>`
  border: none;
  background: ${(props) => (props.$active ? "var(--gradient)" : "transparent")};
  color: ${(props) => (props.$active ? "#fff" : "var(--color-text)")};
  padding: 13px 14px;
  cursor: pointer;
  font-weight: 700;
`;

const Form = styled.form`
  display: grid;
  gap: 12px;
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
`;

const Input = styled.input`
  border-radius: 14px;
  border: 1px solid var(--color-outline);
  padding: 16px 12px 10px;
  background: #fff;
  color: var(--color-text);
  min-height: 52px;
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
`;

const SecondaryButton = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: 999px;
  padding: 13px 16px;
  background: #fff;
  color: var(--color-text);
  cursor: pointer;
  font-weight: 600;
`;

const InlineHelp = styled.p`
  margin: 0;
  color: var(--color-muted);
  font-size: 0.88rem;
  text-align: center;
`;

const Message = styled.p`
  color: var(--color-muted);
  margin: 0;
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

type AuthScreenProps = {
  role: AuthRole;
  onSuccess?: () => void;
  onChangeRole?: () => void;
};

export function AuthScreen({ role, onSuccess, onChangeRole }: AuthScreenProps) {
  const { login, register } = useAppState();
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

  const passwordChecks = [
    { label: t("auth.passwordCheck.length"), ok: password.length >= 8 },
    { label: t("auth.passwordCheck.lower"), ok: /[a-z]/.test(password) },
    { label: t("auth.passwordCheck.upper"), ok: /[A-Z]/.test(password) },
    { label: t("auth.passwordCheck.number"), ok: /\d/.test(password) },
    { label: t("auth.passwordCheck.special"), ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const passwordStrong = passwordChecks.every((check) => check.ok);

  const roleBadge = role === "agent" ? "Agent access" : "Customer account";
  const title =
    role === "agent"
      ? mode === "login"
        ? "Agent sign in"
        : "Create agent account"
      : mode === "login"
        ? "Welcome back"
        : "Create your account";
  const subtitle =
    role === "agent"
      ? "Access listing submissions, manage leads, and continue into the agent tools."
      : "Save listings, track inquiries, and reach out to trusted agents faster.";
  const submitLabel =
    mode === "login"
      ? t("auth.signInButton")
      : role === "agent"
        ? "Create Agent Account"
        : "Create Account";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    if (!isSupabaseConfigured) {
      setMessage(t("auth.supabaseMissing"));
      return;
    }
    if (mode === "register" && !passwordStrong) {
      setMessage(t("auth.passwordWeak"));
      return;
    }
    if (mode === "register" && (!fullName.trim() || !phoneNumber.trim())) {
      setMessage(t("auth.enterNamePhone"));
      return;
    }
    setLoadingMessage(mode === "login" ? t("auth.signingInShort") : t("auth.creatingAccount"));
    const result =
      mode === "login"
        ? await login(email, password)
        : await register(email, password, {
            name: fullName.trim(),
            contactNumber: phoneNumber.trim(),
          });
    setLoadingMessage(null);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setMessage(mode === "login" ? t("auth.signedIn") : t("auth.checkEmail"));
    onSuccess?.();
  };

  const handleGoogle = async () => {
    setMessage(null);
    if (!isSupabaseConfigured) {
      setMessage(t("auth.supabaseMissing"));
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
        setMessage(error.message);
      }
    } catch (error) {
      setLoadingMessage(null);
      setMessage(error instanceof Error ? error.message : "Unable to reach the authentication service.");
    }
  };

  return (
    <Wrapper>
      <Header>
        <TopBar>
          <RoleBadge>{roleBadge}</RoleBadge>
          {onChangeRole ? (
            <SwitchRoleButton type="button" onClick={onChangeRole}>
              Switch role
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
          {role === "agent" ? "Create agent account" : t("auth.register")}
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
              {mode === "login" ? "New here? Create a free account." : "Prefer a faster sign in?"}
            </InlineHelp>
            <SecondaryButton type="button" onClick={handleGoogle}>
              {t("auth.continueGoogle")}
            </SecondaryButton>
          </>
        ) : (
          <InlineHelp>Agent accounts use the same secure credentials and continue into agent tools.</InlineHelp>
        )}
      </Form>

      {message && <Message>{message}</Message>}
      {loadingMessage && <LoadingOverlay message={loadingMessage} />}
    </Wrapper>
  );
}

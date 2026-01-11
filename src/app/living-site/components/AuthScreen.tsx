"use client";

import { useState } from "react";
import styled from "styled-components";
import { useAppState } from "@/app/living-site/lib/app-state";
import { supabase, isSupabaseConfigured } from "@/app/living-site/lib/supabaseClient";
import { LoadingOverlay } from "@/app/living-site/components/LoadingOverlay";

const Wrapper = styled.div`
  display: grid;
  gap: 12px;
`;

const BrandBlock = styled.div<{ $align: "center" | "start" }>`
  display: grid;
  justify-items: ${(props) => (props.$align === "center" ? "center" : "start")};
  gap: 6px;
`;

const BrandMark = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 14px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface-2);
  display: grid;
  place-items: center;
  box-shadow: var(--shadow-soft);

  img {
    width: 32px;
    height: 32px;
  }
`;

const Subtitle = styled.p`
  margin: 0;
  color: var(--color-muted);
  font-size: 0.9rem;
`;

const IntroButtons = styled.div`
  display: grid;
  gap: 10px;
`;

const Tabs = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  border: 1px solid var(--color-outline);
  border-radius: 12px;
  background: var(--color-surface-2);
  overflow: hidden;
  width: 100%;
`;

const TabButton = styled.button<{ $active: boolean }>`
  border: none;
  background: ${(props) => (props.$active ? "var(--color-primary)" : "transparent")};
  color: var(--color-text);
  padding: 10px 14px;
  cursor: pointer;
  font-weight: 600;
`;

const Form = styled.form`
  display: grid;
  gap: 10px;
`;

const Field = styled.label<{ $filled: boolean }>`
  position: relative;
  display: grid;
  gap: 4px;

  &[data-filled="true"] .floating-label,
  &:focus-within .floating-label {
    transform: translateY(-14px) scale(0.9);
    color: var(--color-primary);
  }
`;

const FloatingLabel = styled.span`
  position: absolute;
  left: 12px;
  top: 8px;
  font-size: 0.75rem;
  color: var(--color-muted);
  background: var(--color-surface-2);
  padding: 0 4px;
  transition: transform 0.15s ease, color 0.15s ease;
  transform-origin: left center;
`;

const Input = styled.input`
  border-radius: 10px;
  border: 1px solid var(--color-outline);
  padding: 14px 10px 6px;
  background: var(--color-surface-2);
  color: var(--color-text);
  height: 40px;
`;

const PrimaryButton = styled.button`
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  background: var(--gradient);
  color: var(--color-text);
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--frame-shadow);
`;

const SecondaryButton = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  background: var(--color-surface-2);
  color: var(--color-text);
  cursor: pointer;
  font-weight: 600;
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
  box-shadow: ${(props) =>
    props.$active
      ? "0 0 0 2px color-mix(in srgb, var(--color-primary) 25%, transparent)"
      : "none"};
`;


type Mode = "login" | "register";

type AuthScreenProps = {
  onSuccess?: () => void;
};

export function AuthScreen({ onSuccess }: AuthScreenProps) {
  const { login, register } = useAppState();
  const [mode, setMode] = useState<Mode>("login");
  const [stage, setStage] = useState<"intro" | "form">("intro");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

  const passwordChecks = [
    { label: "At least 8 characters", ok: password.length >= 8 },
    { label: "One lowercase letter", ok: /[a-z]/.test(password) },
    { label: "One uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "One number", ok: /\d/.test(password) },
    { label: "One special character", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const passwordStrong = passwordChecks.every((check) => check.ok);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    if (!isSupabaseConfigured) {
      setMessage("Supabase is not configured.");
      return;
    }
    if (mode === "register" && !passwordStrong) {
      setMessage("Password is too weak.");
      return;
    }
    if (mode === "register" && (!fullName.trim() || !phoneNumber.trim())) {
      setMessage("Enter your full name and phone number.");
      return;
    }
    setLoadingMessage(mode === "login" ? "Signing in..." : "Creating account...");
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
    setMessage(mode === "login" ? "Signed in." : "Check your email to confirm.");
    onSuccess?.();
  };

  const handleGoogle = async () => {
    setMessage(null);
    if (!isSupabaseConfigured) {
      setMessage("Supabase is not configured.");
      return;
    }
    setLoadingMessage("Redirecting to Google...");
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
  };

  return (
    <Wrapper>
      <BrandBlock $align={stage === "intro" ? "center" : "start"}>
        <BrandMark>
          <img src="/KTLogo.png" alt="Eain Chan Myae logo" />
        </BrandMark>
        <strong>Eain Chan Myae</strong>
        <Subtitle>Find property sales and rentals faster.</Subtitle>
      </BrandBlock>
      {stage === "intro" ? (
        <IntroButtons>
          <PrimaryButton type="button" onClick={() => { setMode("login"); setStage("form"); }}>
            Continue with Email
          </PrimaryButton>
          <SecondaryButton type="button" onClick={handleGoogle}>
            Continue with Google
          </SecondaryButton>
        </IntroButtons>
      ) : (
        <>
          <Tabs>
            <TabButton type="button" $active={mode === "login"} onClick={() => setMode("login")}>Login</TabButton>
            <TabButton type="button" $active={mode === "register"} onClick={() => setMode("register")}>Register</TabButton>
          </Tabs>
          <Form onSubmit={handleSubmit}>
            <Field $filled={Boolean(email)} data-filled={Boolean(email)}>
              <FloatingLabel className="floating-label">Email</FloatingLabel>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </Field>
            <Field $filled={Boolean(password)} data-filled={Boolean(password)}>
              <FloatingLabel className="floating-label">Password</FloatingLabel>
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
            {mode === "register" && (
              <>
                <Field $filled={Boolean(fullName)} data-filled={Boolean(fullName)}>
                  <FloatingLabel className="floating-label">Full name</FloatingLabel>
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    required
                  />
                </Field>
                <Field $filled={Boolean(phoneNumber)} data-filled={Boolean(phoneNumber)}>
                  <FloatingLabel className="floating-label">Phone number</FloatingLabel>
                  <Input
                    type="tel"
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    required
                  />
                </Field>
              </>
            )}
            <PrimaryButton type="submit">{mode === "login" ? "Sign in" : "Register"}</PrimaryButton>
            <SecondaryButton type="button" onClick={handleGoogle}>Continue with Google</SecondaryButton>
          </Form>
        </>
      )}
      {message && <Message>{message}</Message>}
      {loadingMessage && (
        <LoadingOverlay message={loadingMessage} />
      )}
    </Wrapper>
  );
}

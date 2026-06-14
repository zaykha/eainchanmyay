"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import { supabase, isSupabaseConfigured } from "@/features/site/shared/lib/supabaseClient";
import { LoadingOverlay } from "@/features/site/shared/components/LoadingOverlay";
import { AGENT_ONBOARDING_STORAGE_KEY } from "@/features/site/shared/components/AuthScreen";
import { writeActiveContext, writeActiveVendorWorkspace } from "@/features/site/vendor/lib/active-context";

const Page = styled.main`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: var(--color-paper);
`;

const Card = styled.div`
  width: min(560px, 100%);
  border: 1px solid var(--color-outline);
  border-radius: 24px;
  background: var(--color-surface);
  box-shadow: var(--shadow-soft);
  padding: 24px;
  display: grid;
  gap: 16px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.6rem;
  color: var(--color-text);
`;

const Copy = styled.p`
  margin: 0;
  color: var(--color-muted);
  line-height: 1.6;
`;

const Form = styled.form`
  display: grid;
  gap: 14px;
`;

const Grid = styled.div`
  display: grid;
  gap: 14px;

  @media (min-width: 720px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const Field = styled.label`
  display: grid;
  gap: 8px;
  font-weight: 600;
  color: var(--color-text);
`;

const Input = styled.input`
  min-height: 46px;
  border-radius: 14px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface-2);
  color: var(--color-text);
  padding: 0 14px;
`;

const Button = styled.button`
  min-height: 46px;
  border: none;
  border-radius: 999px;
  background: var(--gradient);
  color: #fff;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;

const Notice = styled.div<{ $tone?: "error" | "success" }>`
  border-radius: 16px;
  padding: 14px 16px;
  border: 1px solid
    ${(props) => (props.$tone === "error" ? "rgba(225, 29, 72, 0.18)" : "rgba(16, 185, 129, 0.18)")};
  background: ${(props) => (props.$tone === "error" ? "rgba(225, 29, 72, 0.08)" : "rgba(16, 185, 129, 0.08)")};
  color: ${(props) => (props.$tone === "error" ? "#9f1239" : "#0f766e")};
  line-height: 1.6;
`;

type InvitePayload = {
  invite: {
    id: string;
    email: string;
    role: string;
    status: string;
    has_existing_account: boolean;
    expires_at: string | null;
    is_expired: boolean;
    vendor: {
      id?: string;
      name: string;
      slug: string | null;
      logo_url: string | null;
    };
  };
};

export default function AcceptInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite")?.trim() || "";
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const [sessionReady, setSessionReady] = useState(false);
  const [invite, setInvite] = useState<InvitePayload["invite"] | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const requiresPassword = !invite?.has_existing_account;
  const canSubmit = useMemo(() => {
    if (!invite || !inviteToken) return false;
    if (requiresPassword) {
      return Boolean(fullName.trim() && password && confirmPassword && password === confirmPassword && password.length >= 8);
    }
    return true;
  }, [confirmPassword, fullName, invite, inviteToken, password, requiresPassword]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError("Supabase is not configured.");
      return;
    }

    if (!inviteToken) {
      setError("This invite link is incomplete.");
      return;
    }

    let active = true;

    const initialize = async () => {
      if (tokenHash && type) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email",
        });

        if (verifyError) {
          if (active) {
            setError(verifyError.message || "Unable to verify this invite email.");
          }
          return;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        if (active) {
          setError("Please open the invite link from your email again.");
        }
        return;
      }

      const response = await fetch(`/api/public/vendor-invites/${encodeURIComponent(inviteToken)}`);
      const payload = (await response.json().catch(() => null)) as (InvitePayload & { error?: string }) | null;
      if (!response.ok || !payload?.invite) {
        if (active) {
          setError(payload?.error || "Unable to load this invite.");
        }
        return;
      }

      if (active) {
        setInvite(payload.invite);
        setSessionReady(true);
      }
    };

    void initialize();
    return () => {
      active = false;
    };
  }, [inviteToken, tokenHash, type]);

  const handleAccept = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!invite || !inviteToken || !canSubmit) return;

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      if (requiresPassword) {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password,
          data: {
            full_name: fullName.trim() || null,
            name: fullName.trim() || null,
            contact_number: phone.trim() || null,
            phone: phone.trim() || null,
          },
        });

        if (passwordError) {
          throw new Error(passwordError.message || "Unable to save your password.");
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Your invite session has expired. Please open the email link again.");
      }

      const response = await fetch("/api/public/vendor-invites/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          invite_token: inviteToken,
          full_name: fullName.trim() || null,
          phone: phone.trim() || null,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; vendor_id?: string }
        | null;
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Unable to accept this invite.");
      }

      const acceptedVendorId = typeof payload?.vendor_id === "string" ? payload.vendor_id : null;

      if (typeof window !== "undefined") {
        // onboarding flags kept as-is
        window.localStorage.setItem(AGENT_ONBOARDING_STORAGE_KEY, "1");
        window.localStorage.setItem("kaiten_skip_agency_setup_on_hub", "1");

        // Persist active vendor workspace selection for /hub
        writeActiveContext("vendor");

        // We must not block the flow if vendor.id isn't present;
        // VendorShell will fall back safely.
        if (acceptedVendorId) {
          const sessionUser = (await supabase.auth.getUser(session.access_token)).data.user;
          if (sessionUser?.id) {
            writeActiveVendorWorkspace(sessionUser.id, acceptedVendorId);
          }
          // Invalidate potentially stale workspace cache for this user+variant.
          try {
            // Old (pre-vendorId-key) cache entry
            window.localStorage.removeItem(`ecm_vendor_workspace_v1:summary:${sessionUser?.id}`);
            // New cache entry (vendorId included)
            window.localStorage.removeItem(`ecm_vendor_workspace_v1:summary:${sessionUser?.id}:${acceptedVendorId}`);
          } catch {
            // ignore
          }
        }
      }

      setMessage("Invite accepted. Opening your agency workspace...");
      window.setTimeout(() => router.replace("/hub"), 400);
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : "Unable to accept this invite.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!sessionReady && !error) {
    return <LoadingOverlay message="Preparing your invite..." />;
  }

  return (
    <Page>
      <Card>
        <div style={{ display: "grid", gap: 8 }}>
          <Title>Join {invite?.vendor.name || "Agency workspace"}</Title>
          <Copy>
            {requiresPassword
              ? "Set your password and finish onboarding to start managing this agency workspace."
              : "Confirm this invite to add your existing account into the agency workspace."}
          </Copy>
        </div>

        {error ? <Notice $tone="error">{error}</Notice> : null}
        {message ? <Notice $tone="success">{message}</Notice> : null}

        {invite && !invite.is_expired && invite.status === "pending" ? (
          <Form onSubmit={handleAccept}>
            <Grid>
              <Field>
                Invited email
                <Input value={invite.email} readOnly />
              </Field>
              <Field>
                Workspace role
                <Input value={invite.role.replace(/_/g, " ")} readOnly />
              </Field>
            </Grid>

            {requiresPassword ? (
              <>
                <Grid>
                  <Field>
                    Full name
                    <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your name" />
                  </Field>
                  <Field>
                    Phone
                    <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="09..." />
                  </Field>
                </Grid>
                <Grid>
                  <Field>
                    Password
                    <Input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="At least 8 characters"
                    />
                  </Field>
                  <Field>
                    Confirm password
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Repeat password"
                    />
                  </Field>
                </Grid>
              </>
            ) : null}

            <Button type="submit" disabled={!canSubmit || submitting}>
              {submitting ? "Joining workspace..." : "Accept invite"}
            </Button>
          </Form>
        ) : (
          <Notice $tone="error">
            {invite?.is_expired ? "This invite has expired." : "This invite is no longer available."}
          </Notice>
        )}
      </Card>
    </Page>
  );
}

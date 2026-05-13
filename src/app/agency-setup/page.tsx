"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { Building2, ArrowRight, Image as ImageIcon, Mail, Phone, FileText, Upload } from "lucide-react";
import { useAppState } from "@/app/living-site/lib/app-state";
import { LoadingOverlay } from "@/app/living-site/components/LoadingOverlay";
import { isVendorStorefrontSetupComplete, slugifyVendorSlug } from "@/lib/vendor-storefront";

const Page = styled.main`
  min-height: 100vh;
  padding: 28px 18px 40px;
  background:
    radial-gradient(circle at top, rgba(255, 61, 93, 0.12), transparent 34%),
    linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 96%, white) 0%, var(--color-paper) 100%);
  color: var(--color-text);
`;

const Shell = styled.div`
  width: min(960px, 100%);
  margin: 0 auto;
  display: grid;
  gap: 20px;
`;

const Header = styled.div`
  display: grid;
  gap: 10px;
`;

const Eyebrow = styled.span`
  width: fit-content;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  color: var(--color-primary);
  display: inline-flex;
  align-items: center;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 0.98;
`;

const Copy = styled.p`
  margin: 0;
  color: var(--color-muted);
  line-height: 1.65;
  max-width: 760px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr);
  align-items: start;
  gap: 18px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.section`
  border-radius: 28px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface);
  padding: 22px;
  display: grid;
  gap: 16px;
  box-shadow: var(--shadow-soft);
`;

const FieldGrid = styled.div`
  display: grid;
  gap: 16px;
`;

const Field = styled.label`
  display: grid;
  gap: 8px;
`;

const Label = styled.span`
  font-size: 0.9rem;
  color: var(--color-muted);
  font-weight: 600;
`;

const InputWrap = styled.div`
  display: grid;
  grid-template-columns: 42px 1fr;
  align-items: center;
  border: 1px solid var(--color-outline);
  border-radius: 16px;
  background: var(--color-surface-2);
  overflow: hidden;

  svg {
    justify-self: center;
    color: var(--color-muted);
  }
`;

const Input = styled.input`
  min-height: 50px;
  border: none;
  background: transparent;
  color: var(--color-text);
  padding: 0 14px 0 0;
  outline: none;
`;

const TextareaWrap = styled.div`
  display: grid;
  grid-template-columns: 42px 1fr;
  border: 1px solid var(--color-outline);
  border-radius: 16px;
  background: var(--color-surface-2);
  overflow: hidden;

  svg {
    justify-self: center;
    margin-top: 14px;
    color: var(--color-muted);
  }
`;

const Textarea = styled.textarea`
  min-height: 140px;
  border: none;
  background: transparent;
  color: var(--color-text);
  padding: 12px 14px 12px 0;
  outline: none;
  resize: vertical;
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const LogoUploadButton = styled.button<{ $filled?: boolean }>`
  min-height: 72px;
  width: 100%;
  border-radius: 18px;
  border: 1px dashed ${(props) => (props.$filled ? "var(--color-primary)" : "var(--color-outline)")};
  background: ${(props) =>
    props.$filled
      ? "color-mix(in srgb, var(--color-primary) 6%, var(--color-surface-2))"
      : "var(--color-surface-2)"};
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 14px;
  cursor: pointer;
`;

const LogoUploadCopy = styled.div`
  display: grid;
  gap: 4px;
  text-align: left;
`;

const LogoUploadTitle = styled.span`
  font-weight: 700;
`;

const LogoUploadHint = styled.span`
  font-size: 0.88rem;
  color: var(--color-muted);
`;

const LogoThumb = styled.div<{ $image?: string }>`
  width: 46px;
  height: 46px;
  flex: 0 0 46px;
  border-radius: 14px;
  border: 1px solid var(--color-outline);
  background: ${(props) =>
    props.$image ? `center / cover no-repeat url(${props.$image})` : "var(--color-surface)"};
  display: grid;
  place-items: center;
  color: var(--color-muted);
  overflow: hidden;
`;

const ActionRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const Button = styled.button`
  min-height: 46px;
  padding: 0 18px;
  border-radius: 999px;
  border: none;
  background: var(--gradient);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;

const Secondary = styled.button`
  min-height: 44px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface);
  color: var(--color-text);
  font-weight: 700;
  cursor: pointer;
`;

const Notice = styled.p`
  margin: 0;
  color: var(--color-primary);
  line-height: 1.6;
`;

const Summary = styled.div`
  display: grid;
  gap: 14px;
`;

const SummaryEyebrow = styled.span`
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-primary);
`;

const SummaryHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const SummaryLogo = styled.div<{ $image?: string }>`
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: ${(props) =>
    props.$image ? `center / cover no-repeat url(${props.$image})` : "var(--color-surface-2)"};
  border: 1px solid var(--color-outline);
  display: grid;
  place-items: center;
  color: var(--color-muted);
`;

const SummaryTitle = styled.h2`
  margin: 0;
  font-size: 1.2rem;
`;

const SummaryMeta = styled.div`
  display: grid;
  gap: 10px;
  color: var(--color-muted);
`;

const SummaryLine = styled.div`
  display: grid;
  grid-template-columns: 18px 1fr;
  gap: 10px;
  align-items: start;
  padding-top: 12px;
  border-top: 1px solid color-mix(in srgb, var(--color-outline) 72%, transparent);
`;

const SummaryLineIcon = styled.div`
  color: var(--color-muted);
  display: grid;
  place-items: center;
  padding-top: 1px;
`;

const SummaryLineBody = styled.div`
  display: grid;
  gap: 4px;
`;

const SummaryLabel = styled.span`
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-muted);
`;

const SummaryValue = styled.span`
  line-height: 1.6;
  color: var(--color-text);
`;

type WorkspacePayload = {
  vendor: {
    id: string;
    name: string;
    plan: string | null;
    billing_status: string | null;
    slug: string | null;
    description: string | null;
    contact_phone: string | null;
    contact_email: string | null;
    logo_url: string | null;
    verified_status: string | null;
  };
};

export default function AgencySetupPage() {
  const router = useRouter();
  const { authToken, user, profileReady, logout } = useAppState();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<WorkspacePayload | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState({
    name: "",
    contact_phone: "",
    contact_email: "",
    logo_url: "",
    description: "",
  });

  useEffect(() => {
    if (!profileReady) return;
    if (!user) {
      router.replace("/auth");
      return;
    }
    if (!authToken) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/vendor/workspace?includeUsage=false", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        const payload = (await response.json().catch(() => null)) as (WorkspacePayload & { error?: string }) | null;
        if (!response.ok || !payload?.vendor) {
          throw new Error(payload?.error || "Unable to load agency setup.");
        }
        if (cancelled) return;
        setWorkspace(payload);
        setForm({
          name: payload.vendor.name || "",
          contact_phone: payload.vendor.contact_phone || "",
          contact_email: payload.vendor.contact_email || "",
          logo_url: payload.vendor.logo_url || "",
          description: payload.vendor.description || "",
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load agency setup.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [authToken, profileReady, router, user]);

  const isComplete = useMemo(
    () =>
      isVendorStorefrontSetupComplete({
        name: form.name,
        contact_phone: form.contact_phone,
        contact_email: form.contact_email,
        logo_url: form.logo_url,
        description: form.description,
      }),
    [form]
  );

  const nextHref = workspace?.vendor.plan === "free" ? "/hub" : "/vendor";
  const identityLocked = workspace?.vendor.verified_status === "approved";

  const handleLogoPick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !authToken || !workspace) return;

    setUploadingLogo(true);
    setError(null);
    try {
      const uploadBody = new FormData();
      uploadBody.append("file", file);
      const response = await fetch("/api/vendor/logo-upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: uploadBody,
      });
      const payload = (await response.json().catch(() => null)) as { publicUrl?: string; error?: string } | null;
      if (!response.ok || !payload?.publicUrl) {
        throw new Error(payload?.error || "Unable to upload logo.");
      }
      setForm((current) => ({ ...current, logo_url: payload.publicUrl ?? current.logo_url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload logo.");
    } finally {
      if (event.target) {
        event.target.value = "";
      }
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {

    if (!authToken || !workspace) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/vendor/workspace", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: form.name,
          contact_phone: form.contact_phone,
          contact_email: form.contact_email,
          logo_url: form.logo_url,
          description: form.description,
          slug: slugifyVendorSlug(identityLocked ? workspace.vendor.slug || form.name : form.name),
          public_storefront_enabled: true,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to save agency setup.");
      }

      // Avoid /hub immediately redirecting back to /agency-setup while the updated storefront state
      // is still propagating / being reloaded.
      if (typeof window !== "undefined") {
        window.localStorage.setItem("kaiten_skip_agency_setup_on_hub_once", "1");
      }

      router.replace(nextHref);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save agency setup.");
    } finally {
      setSaving(false);
    }
  };

  if (!profileReady || loading) {
    return <LoadingOverlay message="Preparing agency setup..." />;
  }

  return (
    <Page>
      <Shell>
        <Header>
          <Eyebrow>Agency setup</Eyebrow>
          <Title>Build your public profile</Title>
          <Copy>
            Set the basics buyers should see first: agency name, contact, logo, and a short bio. Published listings
            will appear on your public profile automatically.
          </Copy>
        </Header>

        {error ? <Notice>{error}</Notice> : null}

        <Grid>
          <Card>
            {identityLocked ? (
              <Notice>Verified agencies cannot change their public name anymore. Logo, contact, and bio can still be updated.</Notice>
            ) : null}
            <FieldGrid>
              <Field>
                <Label>Agency name</Label>
                <InputWrap>
                  <Building2 size={18} />
                  <Input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    disabled={identityLocked}
                  />
                </InputWrap>
              </Field>

              <Field>
                <Label>Phone or contact</Label>
                <InputWrap>
                  <Phone size={18} />
                  <Input
                    value={form.contact_phone}
                    onChange={(event) => setForm((current) => ({ ...current, contact_phone: event.target.value }))}
                    placeholder="+95..."
                  />
                </InputWrap>
              </Field>

              <Field>
                <Label>Contact email</Label>
                <InputWrap>
                  <Mail size={18} />
                  <Input
                    value={form.contact_email}
                    onChange={(event) => setForm((current) => ({ ...current, contact_email: event.target.value }))}
                    placeholder="agency@example.com"
                  />
                </InputWrap>
              </Field>

              <Field>
                <Label>Agency logo</Label>
                <HiddenFileInput ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoPick} />
                <LogoUploadButton
                  type="button"
                  $filled={Boolean(form.logo_url)}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingLogo}
                >
                  <SummaryHeader>
                    <LogoThumb $image={form.logo_url || undefined}>
                      {!form.logo_url ? <ImageIcon size={18} /> : null}
                    </LogoThumb>
                    <LogoUploadCopy>
                      <LogoUploadTitle>{uploadingLogo ? "Uploading logo..." : "Upload logo image"}</LogoUploadTitle>
                      <LogoUploadHint>
                        {form.logo_url ? "Logo uploaded. Click to replace it." : "PNG, JPG, or WebP"}
                      </LogoUploadHint>
                    </LogoUploadCopy>
                  </SummaryHeader>
                  <Upload size={18} />
                </LogoUploadButton>
              </Field>

              <Field>
                <Label>Short bio</Label>
                <TextareaWrap>
                  <FileText size={18} />
                  <Textarea
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder="What should buyers know first about your agency?"
                  />
                </TextareaWrap>
              </Field>
            </FieldGrid>

            <ActionRow>
              <Secondary type="button" onClick={() => router.push("/" )}>
                Later
              </Secondary>
              <Button type="button" onClick={() => void handleSave()} disabled={saving || !isComplete}>
                {saving ? "Saving..." : "Continue"}
                <ArrowRight size={18} />
              </Button>

              <Secondary
                type="button"
                onClick={async () => {
                  if (typeof window !== "undefined") {
                    window.localStorage.removeItem("kaiten_skip_agency_setup_on_hub");
                    window.localStorage.removeItem("kaiten_skip_agency_setup_on_hub_once");
                  }

                  try {
                    await logout();
                  } finally {
                    // Ensure state is not reused on subsequent navigation
                    if (typeof window !== "undefined") {
                      window.localStorage.removeItem("kaiten_skip_agency_setup_on_hub");
                      window.localStorage.removeItem("kaiten_skip_agency_setup_on_hub_once");
                    }
                  }

                  router.replace("/");
                }}
              >
                Sign out
              </Secondary>
            </ActionRow>
          </Card>

          <Card>
            <Summary>
              <SummaryEyebrow>Public profile snapshot</SummaryEyebrow>
              <SummaryHeader>
                <SummaryLogo $image={form.logo_url || undefined}>{!form.logo_url ? <ImageIcon size={20} /> : null}</SummaryLogo>
                <div>
                  <SummaryTitle>{form.name || "Agency name"}</SummaryTitle>
                  <SummaryMeta>
                    <span>What buyers will see first</span>
                  </SummaryMeta>
                </div>
              </SummaryHeader>
              <SummaryLine>
                <SummaryLineIcon>
                  <Phone size={16} />
                </SummaryLineIcon>
                <SummaryLineBody>
                  <SummaryLabel>Phone</SummaryLabel>
                  <SummaryValue>{form.contact_phone || "Phone number"}</SummaryValue>
                </SummaryLineBody>
              </SummaryLine>
              <SummaryLine>
                <SummaryLineIcon>
                  <Mail size={16} />
                </SummaryLineIcon>
                <SummaryLineBody>
                  <SummaryLabel>Email</SummaryLabel>
                  <SummaryValue>{form.contact_email || "Contact email"}</SummaryValue>
                </SummaryLineBody>
              </SummaryLine>
              <SummaryLine>
                <SummaryLineIcon>
                  <FileText size={16} />
                </SummaryLineIcon>
                <SummaryLineBody>
                  <SummaryLabel>Bio</SummaryLabel>
                  <SummaryValue>{form.description || "Short bio preview"}</SummaryValue>
                </SummaryLineBody>
              </SummaryLine>
              {!isComplete ? (
                <Notice>Fill name, one contact method, upload a logo, and add a short bio to continue.</Notice>
              ) : null}
            </Summary>
          </Card>
        </Grid>
      </Shell>
    </Page>
  );
}

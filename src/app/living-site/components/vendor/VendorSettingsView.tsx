"use client";

import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { usePathname, useRouter } from "next/navigation";
import { ImageIcon, Upload } from "lucide-react";
import { useAppState } from "@/app/living-site/lib/app-state";
import { LoadingOverlay } from "@/app/living-site/components/LoadingOverlay";
import { MarketplaceHeader } from "@/app/living-site/components/MarketplaceHeader";
import { slugifyVendorSlug } from "@/lib/vendor-storefront";

const Shell = styled.div`
  min-height: 100vh;
`;

const PageShell = styled.div`
  max-width: 1140px;
  margin: 0 auto;
  padding: 18px 16px 72px;
  display: grid;
  gap: 18px;
`;

const Page = styled.div`
  display: grid;
  gap: 18px;
`;

const HeroCard = styled.div`
  border-radius: 28px;
  border: 1px solid var(--color-outline);
  background:
    radial-gradient(circle at top right, rgba(239, 35, 64, 0.08), transparent 34%),
    linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 90%, white) 0%, var(--color-surface) 100%);
  padding: 24px;
  display: grid;
  gap: 12px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  color: var(--color-text);
`;

const Copy = styled.p`
  margin: 0;
  color: var(--color-muted);
  line-height: 1.6;
  max-width: 760px;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  border-radius: 24px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface);
  padding: 20px;
  display: grid;
  gap: 12px;
`;

const SectionBlock = styled.div`
  display: grid;
  gap: 14px;
  padding: 18px;
  border-radius: 20px;
  border: 1px solid var(--color-outline);
  background: color-mix(in srgb, var(--color-surface-2) 58%, white);
`;

const SectionHeader = styled.div`
  display: grid;
  gap: 4px;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 1.02rem;
  color: var(--color-text);
`;

const SectionCopy = styled.p`
  margin: 0;
  color: var(--color-muted);
  line-height: 1.5;
  font-size: 0.92rem;
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const BrandAssetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }
`;

const AssetCard = styled.div`
  display: grid;
  gap: 10px;
`;

const AssetUploadButton = styled.button<{ $wide?: boolean }>`
  width: 100%;
  border-radius: 18px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface);
  padding: 12px;
  display: grid;
  gap: 10px;
  cursor: pointer;
  text-align: left;

  &:hover {
    border-color: color-mix(in srgb, var(--color-primary) 24%, var(--color-outline));
    box-shadow: var(--shadow-soft);
  }
`;

const AssetThumb = styled.div<{ $image?: string; $wide?: boolean }>`
  width: 100%;
  aspect-ratio: ${(props) => (props.$wide ? "16 / 6" : "1 / 0.78")};
  border-radius: 16px;
  border: 1px solid var(--color-outline);
  background:
    ${(props) => (props.$image ? `url(${props.$image}) center/cover no-repeat` : "var(--color-surface-2)")};
  display: grid;
  place-items: center;
  color: var(--color-muted);
  overflow: hidden;
`;

const AssetUploadRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const AssetUploadText = styled.div`
  display: grid;
  gap: 4px;
`;

const AssetUploadTitle = styled.div`
  color: var(--color-text);
  font-weight: 700;
`;

const AssetUploadHint = styled.div`
  color: var(--color-muted);
  font-size: 0.88rem;
  line-height: 1.45;
`;

const Label = styled.div`
  color: var(--color-muted);
  font-size: 0.9rem;
`;

const Value = styled.div`
  color: var(--color-text);
  font-weight: 700;
  line-height: 1.45;
`;

const FormField = styled.label`
  display: grid;
  gap: 8px;
`;

const Input = styled.input`
  min-height: 46px;
  border-radius: 14px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface);
  color: var(--color-text);
  padding: 0 14px;
  outline: none;

  &:focus {
    border-color: color-mix(in srgb, var(--color-primary) 30%, var(--color-outline));
  }
`;

const Textarea = styled.textarea`
  min-height: 132px;
  border-radius: 14px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface);
  color: var(--color-text);
  padding: 12px 14px;
  outline: none;
  resize: vertical;

  &:focus {
    border-color: color-mix(in srgb, var(--color-primary) 30%, var(--color-outline));
  }
`;

const Toggle = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--color-text);
  font-weight: 600;

  input {
    width: 18px;
    height: 18px;
  }
`;

const InlineActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const Button = styled.button`
  min-height: 44px;
  padding: 0 16px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #ff3d5d 0%, #e91b42 100%);
  color: white;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;

const Success = styled.div`
  border-radius: 18px;
  border: 1px solid rgba(111, 232, 192, 0.22);
  background: rgba(111, 232, 192, 0.08);
  padding: 14px 16px;
  color: #0f766e;
  line-height: 1.6;
`;

const Notice = styled.div<{ $danger?: boolean }>`
  border-radius: 20px;
  border: 1px solid ${(props) => (props.$danger ? "rgba(255, 148, 148, 0.22)" : "rgba(255, 210, 92, 0.32)")};
  background: ${(props) => (props.$danger ? "rgba(255, 148, 148, 0.08)" : "rgba(255, 210, 92, 0.1)")};
  padding: 16px 18px;
  color: ${(props) => (props.$danger ? "#b42318" : "#9a6700")};
  line-height: 1.6;
`;

type WorkspaceSummary = {
  vendor: {
    id: string;
    name: string;
    vendor_type: string;
    plan: string | null;
    slug: string | null;
    tagline: string | null;
    description: string | null;
    contact_phone: string | null;
    contact_email: string | null;
    logo_url: string | null;
    facebook_url: string | null;
    telegram_url: string | null;
    viber_phone: string | null;
    tiktok_url: string | null;
    website_url: string | null;
    cover_image_url: string | null;
    strengths: string[];
    public_storefront_enabled: boolean;
    verified_status: string | null;
  };
  membership: {
    role: string;
  };
  profile: {
    full_name: string | null;
    email: string | null;
  };
  limits?: {
    currentPlan?: {
      name: string;
    };
    listingCount?: number;
    listingLimit?: number;
    listingNearLimit?: boolean;
    listingOverLimit?: boolean;
    agentCount?: number;
    agentLimit?: number;
    agentNearLimit?: boolean;
    agentOverLimit?: boolean;
    suggestedUpgrade?: {
      name: string;
      priceLabel: string;
    } | null;
  };
};

type StorefrontFormState = {
  slug: string;
  tagline: string;
  description: string;
  contact_phone: string;
  contact_email: string;
  logo_url: string;
  facebook_url: string;
  telegram_url: string;
  viber_phone: string;
  tiktok_url: string;
  website_url: string;
  cover_image_url: string;
  strengths: string;
  public_storefront_enabled: boolean;
};

function createStorefrontState(vendor: WorkspaceSummary["vendor"]): StorefrontFormState {
  return {
    slug: vendor.slug || "",
    tagline: vendor.tagline || "",
    description: vendor.description || "",
    contact_phone: vendor.contact_phone || "",
    contact_email: vendor.contact_email || "",
    logo_url: vendor.logo_url || "",
    facebook_url: vendor.facebook_url || "",
    telegram_url: vendor.telegram_url || "",
    viber_phone: vendor.viber_phone || "",
    tiktok_url: vendor.tiktok_url || "",
    website_url: vendor.website_url || "",
    cover_image_url: vendor.cover_image_url || "",
    strengths: vendor.strengths.join("\n"),
    public_storefront_enabled: vendor.public_storefront_enabled,
  };
}

export function VendorSettingsView() {
  const pathname = usePathname();
  const router = useRouter();
  const { authToken } = useAppState();
  const [workspace, setWorkspace] = useState<WorkspaceSummary | null>(null);
  const [storefront, setStorefront] = useState<StorefrontFormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!authToken) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/vendor/workspace", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        const payload = (await response.json()) as WorkspaceSummary & { error?: string };
        if (!response.ok) {
          throw new Error(payload?.error || "Unable to load workspace settings.");
        }
        if (!cancelled) {
          setWorkspace(payload);
          setStorefront(createStorefrontState(payload.vendor));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load workspace settings.");
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
  }, [authToken]);

  const isHubSettings = pathname === "/hub/settings";

  if (loading) {
    return isHubSettings ? (
      <Shell>
        <MarketplaceHeader />
        <PageShell>
          <LoadingOverlay message="Loading settings..." />
        </PageShell>
      </Shell>
    ) : (
      <LoadingOverlay message="Loading settings..." />
    );
  }

  if (saving) {
    return isHubSettings ? (
      <Shell>
        <MarketplaceHeader />
        <PageShell>
          <LoadingOverlay message="Saving storefront..." />
        </PageShell>
      </Shell>
    ) : (
      <LoadingOverlay message="Saving storefront..." />
    );
  }

  const canEditStorefront = workspace?.membership.role === "owner" || workspace?.membership.role === "admin";
  const identityLocked = workspace?.vendor.verified_status === "approved";
  const handleStorefrontChange = <K extends keyof StorefrontFormState>(key: K, value: StorefrontFormState[K]) => {
    setStorefront((current) => (current ? { ...current, [key]: value } : current));
  };

  const handleBrandUpload = async (kind: "logo" | "cover", file: File | null) => {
    if (!authToken || !file) return;

    const setUploading = kind === "logo" ? setUploadingLogo : setUploadingCover;
    const field = kind === "logo" ? "logo_url" : "cover_image_url";
    const endpoint = kind === "logo" ? "/api/vendor/logo-upload" : "/api/vendor/cover-upload";

    setUploading(true);
    setError(null);
    setSaveMessage(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body,
      });
      const payload = (await response.json().catch(() => null)) as { publicUrl?: string; error?: string } | null;
      if (!response.ok || !payload?.publicUrl) {
        throw new Error(payload?.error || `Unable to upload ${kind}.`);
      }
      handleStorefrontChange(field, payload.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Unable to upload ${kind}.`);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveStorefront = async () => {
    if (!authToken || !storefront || !workspace) return;

    setSaving(true);
    setError(null);
    setSaveMessage(null);
    try {
      const response = await fetch("/api/vendor/workspace", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          ...storefront,
          slug: slugifyVendorSlug(storefront.slug || workspace.vendor.name),
          strengths: storefront.strengths,
        }),
      });
      const payload = (await response.json()) as WorkspaceSummary & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to save storefront settings.");
      }

      setWorkspace(payload);
      setStorefront(createStorefrontState(payload.vendor));
      if (isHubSettings) {
        router.replace("/hub");
        return;
      }
      setSaveMessage("Agency storefront saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save storefront settings.");
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <Page>
      <HeroCard>
        <Title>Organization settings</Title>
        <Copy>
          Manage the public agency page buyers see first. Keep your identity, contact channels, and storefront details clean and consistent here.
        </Copy>
      </HeroCard>

      {error ? <Copy>{error}</Copy> : null}

      {workspace && storefront ? (
        <Card>
          <SectionHeader>
            <SectionTitle>Agency storefront</SectionTitle>
            <SectionCopy>
              This is the public agency profile page buyers use to understand your brand, browse listings, and contact the team.
            </SectionCopy>
          </SectionHeader>
          {identityLocked ? (
            <Notice>Name and slug are locked after verification approval. Contact details, branding, and channels can still be updated.</Notice>
          ) : null}
          {saveMessage ? <Success>{saveMessage}</Success> : null}
          <SectionBlock>
            <SectionHeader>
              <SectionTitle>Identity</SectionTitle>
              <SectionCopy>These are the first storefront details buyers will scan.</SectionCopy>
            </SectionHeader>
            <HiddenFileInput
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                void handleBrandUpload("logo", file);
                event.target.value = "";
              }}
            />
            <HiddenFileInput
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                void handleBrandUpload("cover", file);
                event.target.value = "";
              }}
            />
            <BrandAssetGrid>
              <AssetCard>
                <Label>Agency logo</Label>
                <AssetUploadButton
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={!canEditStorefront || saving || uploadingLogo}
                >
                  <AssetThumb $image={storefront.logo_url || undefined}>
                    {!storefront.logo_url ? <ImageIcon size={22} /> : null}
                  </AssetThumb>
                  <AssetUploadRow>
                    <AssetUploadText>
                      <AssetUploadTitle>{uploadingLogo ? "Uploading logo..." : "Upload logo image"}</AssetUploadTitle>
                      <AssetUploadHint>
                        {storefront.logo_url ? "Click image to replace." : "PNG, JPG, or WebP"}
                      </AssetUploadHint>
                    </AssetUploadText>
                    <Upload size={18} />
                  </AssetUploadRow>
                </AssetUploadButton>
              </AssetCard>

              <AssetCard>
                <Label>Cover image</Label>
                <AssetUploadButton
                  type="button"
                  $wide
                  onClick={() => coverInputRef.current?.click()}
                  disabled={!canEditStorefront || saving || uploadingCover}
                >
                  <AssetThumb $image={storefront.cover_image_url || undefined} $wide>
                    {!storefront.cover_image_url ? <ImageIcon size={22} /> : null}
                  </AssetThumb>
                  <AssetUploadRow>
                    <AssetUploadText>
                      <AssetUploadTitle>{uploadingCover ? "Uploading cover..." : "Upload cover image"}</AssetUploadTitle>
                      <AssetUploadHint>
                        {storefront.cover_image_url ? "Click image to replace." : "Wide image recommended"}
                      </AssetUploadHint>
                    </AssetUploadText>
                    <Upload size={18} />
                  </AssetUploadRow>
                </AssetUploadButton>
              </AssetCard>
            </BrandAssetGrid>
            <FormGrid>
              <FormField>
                <Label>Agency slug</Label>
                <Input
                  value={storefront.slug}
                  onChange={(event) => handleStorefrontChange("slug", slugifyVendorSlug(event.target.value))}
                  placeholder="eain-chan-myay"
                  disabled={!canEditStorefront || saving || identityLocked}
                />
              </FormField>
              <FormField>
                <Label>Tagline</Label>
                <Input
                  value={storefront.tagline}
                  onChange={(event) => handleStorefrontChange("tagline", event.target.value)}
                  placeholder="Trusted Yangon residential specialists"
                  disabled={!canEditStorefront || saving}
                />
              </FormField>
              <FormField style={{ gridColumn: "1 / -1" }}>
                <Label>Agency description</Label>
                <Textarea
                  value={storefront.description}
                  onChange={(event) => handleStorefrontChange("description", event.target.value)}
                  placeholder="What makes your agency strong, trusted, and useful for buyers."
                  disabled={!canEditStorefront || saving}
                />
              </FormField>
              <FormField style={{ gridColumn: "1 / -1" }}>
                <Label>Strengths</Label>
                <Textarea
                  value={storefront.strengths}
                  onChange={(event) => handleStorefrontChange("strengths", event.target.value)}
                  placeholder={"One strength per line\nFast viewing coordination\nStrong condo inventory"}
                  disabled={!canEditStorefront || saving}
                />
              </FormField>
            </FormGrid>
          </SectionBlock>

          <SectionBlock>
            <SectionHeader>
              <SectionTitle>Contact and channels</SectionTitle>
              <SectionCopy>Add at least one strong buyer contact path. Facebook and Viber are especially useful for Myanmar users.</SectionCopy>
            </SectionHeader>
            <FormGrid>
              <FormField>
                <Label>Contact phone</Label>
                <Input
                  value={storefront.contact_phone}
                  onChange={(event) => handleStorefrontChange("contact_phone", event.target.value)}
                  placeholder="+95..."
                  disabled={!canEditStorefront || saving}
                />
              </FormField>
              <FormField>
                <Label>Contact email</Label>
                <Input
                  value={storefront.contact_email}
                  onChange={(event) => handleStorefrontChange("contact_email", event.target.value)}
                  placeholder="agency@example.com"
                  disabled={!canEditStorefront || saving}
                />
              </FormField>
              <FormField>
                <Label>Facebook URL</Label>
                <Input
                  value={storefront.facebook_url}
                  onChange={(event) => handleStorefrontChange("facebook_url", event.target.value)}
                  placeholder="https://facebook.com/youragency"
                  disabled={!canEditStorefront || saving}
                />
              </FormField>
              <FormField>
                <Label>Telegram URL</Label>
                <Input
                  value={storefront.telegram_url}
                  onChange={(event) => handleStorefrontChange("telegram_url", event.target.value)}
                  placeholder="https://t.me/youragency"
                  disabled={!canEditStorefront || saving}
                />
              </FormField>
              <FormField>
                <Label>Viber phone</Label>
                <Input
                  value={storefront.viber_phone}
                  onChange={(event) => handleStorefrontChange("viber_phone", event.target.value)}
                  placeholder="+95..."
                  disabled={!canEditStorefront || saving}
                />
              </FormField>
              <FormField>
                <Label>TikTok URL</Label>
                <Input
                  value={storefront.tiktok_url}
                  onChange={(event) => handleStorefrontChange("tiktok_url", event.target.value)}
                  placeholder="https://www.tiktok.com/@youragency"
                  disabled={!canEditStorefront || saving}
                />
              </FormField>
              <FormField style={{ gridColumn: "1 / -1" }}>
                <Label>Website URL</Label>
                <Input
                  value={storefront.website_url}
                  onChange={(event) => handleStorefrontChange("website_url", event.target.value)}
                  placeholder="https://youragency.com"
                  disabled={!canEditStorefront || saving}
                />
              </FormField>
            </FormGrid>
          </SectionBlock>

          <SectionBlock>
            <SectionHeader>
              <SectionTitle>Visibility</SectionTitle>
              <SectionCopy>Control whether this storefront is publicly visible and jump to your live page when ready.</SectionCopy>
            </SectionHeader>

            <Toggle>
              <input
                type="checkbox"
                checked={storefront.public_storefront_enabled}
                onChange={(event) => handleStorefrontChange("public_storefront_enabled", event.target.checked)}
                disabled={!canEditStorefront || saving}
              />
              Public storefront enabled
            </Toggle>
          </SectionBlock>

          <InlineActions>
            {canEditStorefront ? (
              <Button type="button" onClick={() => void handleSaveStorefront()} disabled={saving}>
                {saving ? "Saving..." : "Save storefront"}
              </Button>
            ) : null}
          </InlineActions>
        </Card>
      ) : null}
    </Page>
  );

  if (isHubSettings) {
    return (
      <Shell>
        <MarketplaceHeader />
        <PageShell>{content}</PageShell>
      </Shell>
    );
  }

  return content;
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import { useAppState } from "@/app/living-site/lib/app-state";
import { LoadingOverlay } from "@/app/living-site/components/LoadingOverlay";
import { slugifyVendorSlug } from "@/lib/vendor-storefront";

const Page = styled.div`
  display: grid;
  gap: 18px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  color: #f8fafc;
`;

const Copy = styled.p`
  margin: 0;
  color: #98a2b3;
  line-height: 1.6;
  max-width: 760px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
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
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #151b29;
  padding: 20px;
  display: grid;
  gap: 12px;
`;

const Label = styled.div`
  color: #98a2b3;
  font-size: 0.9rem;
`;

const Value = styled.div`
  color: #f8fafc;
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
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: #0f1623;
  color: #f8fafc;
  padding: 0 14px;
  outline: none;

  &:focus {
    border-color: rgba(255, 255, 255, 0.22);
  }
`;

const Textarea = styled.textarea`
  min-height: 132px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: #0f1623;
  color: #f8fafc;
  padding: 12px 14px;
  outline: none;
  resize: vertical;

  &:focus {
    border-color: rgba(255, 255, 255, 0.22);
  }
`;

const Toggle = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #f8fafc;
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

const SecondaryButton = styled(Link)`
  min-height: 44px;
  padding: 0 16px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #f8fafc;
  font-weight: 700;
`;

const Success = styled.div`
  border-radius: 18px;
  border: 1px solid rgba(111, 232, 192, 0.22);
  background: rgba(111, 232, 192, 0.08);
  padding: 14px 16px;
  color: #d4ffe8;
  line-height: 1.6;
`;

const Action = styled(Link)`
  width: fit-content;
  min-height: 44px;
  padding: 0 16px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  color: white;
  background: linear-gradient(135deg, #ff3d5d 0%, #e91b42 100%);
  font-weight: 700;
`;

const Notice = styled.div<{ $danger?: boolean }>`
  border-radius: 20px;
  border: 1px solid ${(props) => (props.$danger ? "rgba(255, 148, 148, 0.22)" : "rgba(255, 210, 92, 0.22)")};
  background: ${(props) => (props.$danger ? "rgba(255, 148, 148, 0.08)" : "rgba(255, 210, 92, 0.08)")};
  padding: 16px 18px;
  color: ${(props) => (props.$danger ? "#ffd9df" : "#f2dfab")};
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
    cover_image_url: vendor.cover_image_url || "",
    strengths: vendor.strengths.join("\n"),
    public_storefront_enabled: vendor.public_storefront_enabled,
  };
}

function labelize(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function VendorSettingsView() {
  const { authToken } = useAppState();
  const [workspace, setWorkspace] = useState<WorkspaceSummary | null>(null);
  const [storefront, setStorefront] = useState<StorefrontFormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

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

  if (loading) {
    return <LoadingOverlay message="Loading settings..." />;
  }

  const canEditStorefront = workspace?.membership.role === "owner" || workspace?.membership.role === "admin";
  const storefrontUrl =
    workspace?.vendor.slug && storefront?.public_storefront_enabled !== false ? `/agency/${workspace.vendor.slug}` : null;

  const handleStorefrontChange = <K extends keyof StorefrontFormState>(key: K, value: StorefrontFormState[K]) => {
    setStorefront((current) => (current ? { ...current, [key]: value } : current));
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
      setSaveMessage("Agency storefront saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save storefront settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page>
      <Title>Settings</Title>
      <Copy>
        Workspace settings now include the public agency storefront. Owners and admins can publish branding, contact points, and agency strengths for buyers to see.
      </Copy>

      {error ? <Copy>{error}</Copy> : null}

      {workspace?.limits && (workspace.limits.listingNearLimit || workspace.limits.agentNearLimit) ? (
        <Notice $danger={workspace.limits.listingOverLimit || workspace.limits.agentOverLimit}>
          {workspace.limits.listingOverLimit || workspace.limits.agentOverLimit
            ? "This workspace is already above the current plan soft limit. Billing enforcement is still pending, but the next phase should convert this into an upgrade path."
            : `This workspace is close to its current plan limit. ${
                workspace.limits.suggestedUpgrade
                  ? `Recommended next step: ${workspace.limits.suggestedUpgrade.name} (${workspace.limits.suggestedUpgrade.priceLabel}).`
                  : "No higher upgrade plan is configured."
              }`}
        </Notice>
      ) : null}

      {workspace ? (
        <Grid>
          <Card>
            <Label>Workspace name</Label>
            <Value>{workspace.vendor.name}</Value>
            <Label>Vendor type</Label>
            <Value>{labelize(workspace.vendor.vendor_type)}</Value>
            <Label>Current plan</Label>
            <Value>{workspace.limits?.currentPlan?.name || workspace.vendor.plan || "Not assigned yet"}</Value>
            <Label>Listing usage</Label>
            <Value>
              {workspace.limits?.listingCount ?? 0} / {workspace.limits?.listingLimit ?? 0}
            </Value>
            <Label>Seat usage</Label>
            <Value>
              {workspace.limits?.agentCount ?? 0} / {workspace.limits?.agentLimit ?? 0}
            </Value>
          </Card>

          <Card>
            <Label>Signed-in member</Label>
            <Value>{workspace.profile.full_name || workspace.profile.email || "Vendor user"}</Value>
            <Label>Membership role</Label>
            <Value>{labelize(workspace.membership.role)}</Value>
            <Label>Email</Label>
            <Value>{workspace.profile.email || "No email"}</Value>
            <Label>Upgrade recommendation</Label>
            <Value>
              {workspace.limits?.suggestedUpgrade
                ? `${workspace.limits.suggestedUpgrade.name} (${workspace.limits.suggestedUpgrade.priceLabel})`
                : "Top plan reached"}
            </Value>
            <Label>Storefront status</Label>
            <Value>{workspace.vendor.public_storefront_enabled ? "Public" : "Hidden"}</Value>
          </Card>
        </Grid>
      ) : null}

      {workspace && storefront ? (
        <Card>
          <Label>Agency storefront</Label>
          <Copy>
            This is the public agency profile page buyers can use to understand your brand, browse your listings, and contact the team.
          </Copy>
          {saveMessage ? <Success>{saveMessage}</Success> : null}
          <FormGrid>
            <FormField>
              <Label>Agency slug</Label>
              <Input
                value={storefront.slug}
                onChange={(event) => handleStorefrontChange("slug", slugifyVendorSlug(event.target.value))}
                placeholder="eain-chan-myay"
                disabled={!canEditStorefront || saving}
              />
            </FormField>
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
              <Label>Tagline</Label>
              <Input
                value={storefront.tagline}
                onChange={(event) => handleStorefrontChange("tagline", event.target.value)}
                placeholder="Trusted Yangon residential specialists"
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
              <Label>Logo image URL</Label>
              <Input
                value={storefront.logo_url}
                onChange={(event) => handleStorefrontChange("logo_url", event.target.value)}
                placeholder="https://..."
                disabled={!canEditStorefront || saving}
              />
            </FormField>
            <FormField>
              <Label>Cover image URL</Label>
              <Input
                value={storefront.cover_image_url}
                onChange={(event) => handleStorefrontChange("cover_image_url", event.target.value)}
                placeholder="https://..."
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

          <Toggle>
            <input
              type="checkbox"
              checked={storefront.public_storefront_enabled}
              onChange={(event) => handleStorefrontChange("public_storefront_enabled", event.target.checked)}
              disabled={!canEditStorefront || saving}
            />
            Public storefront enabled
          </Toggle>

          <InlineActions>
            {canEditStorefront ? (
              <Button type="button" onClick={() => void handleSaveStorefront()} disabled={saving}>
                {saving ? "Saving..." : "Save storefront"}
              </Button>
            ) : null}
            {storefrontUrl ? <SecondaryButton href={storefrontUrl}>View public profile</SecondaryButton> : null}
            <Action href="/request-sale">Open listing request flow</Action>
          </InlineActions>
        </Card>
      ) : null}
    </Page>
  );
}

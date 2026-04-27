"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import { useAppState } from "@/app/living-site/lib/app-state";
import { LoadingOverlay } from "@/app/living-site/components/LoadingOverlay";

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

type WorkspaceSummary = {
  vendor: {
    id: string;
    name: string;
    vendor_type: string;
    plan: string | null;
  };
  membership: {
    role: string;
  };
  profile: {
    full_name: string | null;
    email: string | null;
  };
};

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <Page>
      <Title>Settings</Title>
      <Copy>
        Workspace settings are now grounded in the active vendor record. Billing, branding, invite emails, and seat plan limits can build on top of this in the next phase.
      </Copy>

      {error ? <Copy>{error}</Copy> : null}

      {workspace ? (
        <Grid>
          <Card>
            <Label>Workspace name</Label>
            <Value>{workspace.vendor.name}</Value>
            <Label>Vendor type</Label>
            <Value>{labelize(workspace.vendor.vendor_type)}</Value>
            <Label>Current plan</Label>
            <Value>{workspace.vendor.plan || "Not assigned yet"}</Value>
          </Card>

          <Card>
            <Label>Signed-in member</Label>
            <Value>{workspace.profile.full_name || workspace.profile.email || "Vendor user"}</Value>
            <Label>Membership role</Label>
            <Value>{labelize(workspace.membership.role)}</Value>
            <Label>Email</Label>
            <Value>{workspace.profile.email || "No email"}</Value>
          </Card>
        </Grid>
      ) : null}

      <Card>
        <Copy>
          While the richer settings screens are being ported, the quickest operational path is still the listing request workflow.
        </Copy>
        <Action href="/request-sale">Open listing request flow</Action>
      </Card>
    </Page>
  );
}

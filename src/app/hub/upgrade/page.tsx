"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { MarketplaceHeader } from "@/app/living-site/components/MarketplaceHeader";
import { VendorPlanSelection } from "@/app/living-site/components/vendor/VendorPlanSelection";
import { LoadingOverlay } from "@/app/living-site/components/LoadingOverlay";
import { useAppState } from "@/app/living-site/lib/app-state";
import type { VendorPlanKey } from "@/lib/vendor-plans";

const Page = styled.main`
  min-height: 100vh;
  color: var(--color-text);
  padding: 16px 16px 40px;
`;

type WorkspacePayload = {
  vendor?: {
    id: string;
    name: string;
    plan: string | null;
    billing_status: string | null;
  };
  error?: string;
};

export default function HubUpgradePage() {
  const router = useRouter();
  const { user, profileReady, profileRole, authToken } = useAppState();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [creatingPlan, setCreatingPlan] = useState<VendorPlanKey | null>(null);
  const [workspace, setWorkspace] = useState<WorkspacePayload["vendor"] | null>(null);

  useEffect(() => {
    if (!profileReady) return;

    if (!user || profileRole !== "vendor_user" || !authToken) {
      router.replace("/hub");
      return;
    }

    let cancelled = false;

    const loadWorkspace = async () => {
      setLoading(true);
      const response = await fetch("/api/vendor/workspace?includeUsage=false", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const payload = (await response.json().catch(() => null)) as WorkspacePayload | null;

      if (cancelled) return;

      if (!response.ok || !payload?.vendor?.id) {
        router.replace("/hub");
        return;
      }

      setWorkspace(payload.vendor);

      setLoading(false);
    };

    void loadWorkspace();

    return () => {
      cancelled = true;
    };
  }, [authToken, profileReady, profileRole, router, user]);

  const handleStartPaidCheckout = async (planKey: VendorPlanKey) => {
    if (!authToken || planKey === "free") return;
    setCreatingPlan(planKey);
    setMessage(null);

    try {
      const response = await fetch("/api/vendor/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          plan: planKey,
          vendorType: "agency",
          vendorName: workspace?.name,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { checkoutUrl?: string; error?: string } | null;
      if (!response.ok || !payload?.checkoutUrl) {
        throw new Error(payload?.error ?? "Unable to start Dinger checkout.");
      }

      window.location.href = payload.checkoutUrl;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start Dinger checkout.");
      setCreatingPlan(null);
    }
  };

  if (!profileReady || loading) {
    return <LoadingOverlay message="Preparing upgrade options..." />;
  }

  return (
    <div>
      <MarketplaceHeader />
      <Page>
        <VendorPlanSelection
          mode="upgrade"
          creatingPlan={creatingPlan}
          message={message}
          currentPlan={(workspace?.plan as VendorPlanKey | null | undefined) ?? "free"}
          onSelectPaid={(planKey) => void handleStartPaidCheckout(planKey)}
          onBack={() => router.push("/hub")}
        />
      </Page>
    </div>
  );
}
